use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::core::Instant;
use etwin_core::email::EmailAddress;
use etwin_core::password::PasswordHash;
use etwin_core::temporal::Temporal;
use etwin_core::user::{
  CompleteSimpleUser, CreateUserOptions, DeleteUserError, GetShortUserOptions, GetUserOptions, GetUserResult,
  ShortUser, ShortUserWithPassword, SimpleUser, UpdateUserError, UpdateUserOptions, UserDisplayName,
  UserDisplayNameVersion, UserDisplayNameVersions, UserFields, UserId, UserIdRef, UserRef, UserStore, Username,
  USERNAME_LOCK_DURATION, USER_DISPLAY_NAME_LOCK_DURATION, USER_PASSWORD_LOCK_DURATION,
};
use etwin_core::uuid::UuidGenerator;
use std::collections::hash_map::Entry;
use std::collections::{HashMap, HashSet};
use std::error::Error;
use std::sync::RwLock;

struct MemUserSnapshot<'a> {
  user: &'a MemUser,
  time: Option<Instant>,
}

impl From<MemUserSnapshot<'_>> for ShortUser {
  fn from(user: MemUserSnapshot<'_>) -> Self {
    let MemUserSnapshot { user, time } = user;
    Self {
      id: user.id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: user.display_name.at(time).unwrap().value().clone(),
        },
      },
    }
  }
}

impl From<MemUserSnapshot<'_>> for SimpleUser {
  fn from(user: MemUserSnapshot<'_>) -> Self {
    let MemUserSnapshot { user, time } = user;
    Self {
      id: user.id,
      created_at: user.created_at,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: user.display_name.at(time).unwrap().value().clone(),
        },
      },
      is_administrator: user.is_administrator,
    }
  }
}

impl From<MemUserSnapshot<'_>> for CompleteSimpleUser {
  fn from(user: MemUserSnapshot<'_>) -> Self {
    let MemUserSnapshot { user, time } = user;
    Self {
      id: user.id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: user.display_name.at(time).unwrap().value().clone(),
        },
      },
      is_administrator: user.is_administrator,
      created_at: user.created_at,
      username: user.username.at(time).unwrap().value().clone(),
      email_address: user.email_address.at(time).unwrap().value().clone(),
    }
  }
}

pub(crate) struct StoreState {
  users: HashMap<UserId, MemUser>,
  users_by_username: HashMap<Username, Temporal<Option<UserId>>>,
  users_by_email: HashMap<EmailAddress, Temporal<Option<UserId>>>,
}

impl StoreState {
  fn new() -> Self {
    Self {
      users: HashMap::new(),
      users_by_username: HashMap::new(),
      users_by_email: HashMap::new(),
    }
  }

  fn create(&mut self, time: Instant, user_id: UserId, options: &CreateUserOptions) -> &MemUser {
    let mem_user = MemUser {
      id: user_id,
      created_at: time,
      display_name: Temporal::new(time, options.display_name.clone()),
      email_address: Temporal::new(time, options.email.clone()),
      username: Temporal::new(time, options.username.clone()),
      password: Temporal::new(time, options.password.clone()),
      is_administrator: self.users.is_empty(),
    };
    let mem_user = match self.users.entry(mem_user.id) {
      Entry::Occupied(_) => panic!("UserIdConflict"),
      Entry::Vacant(e) => e.insert(mem_user),
    };
    if let Some(username) = &options.username {
      match self.users_by_username.entry(username.clone()) {
        Entry::Occupied(_) => panic!("UsernameConflict"),
        Entry::Vacant(e) => e.insert(Temporal::new(time, Some(mem_user.id))),
      };
    }
    if let Some(email) = &options.email {
      match self.users_by_email.entry(email.clone()) {
        Entry::Occupied(_) => panic!("EmailConflict"),
        Entry::Vacant(e) => e.insert(Temporal::new(time, Some(mem_user.id))),
      };
    }
    mem_user
  }

  fn ref_to_id(&self, user_ref: &UserRef, time: Option<Instant>) -> Option<(UserId, bool)> {
    Some(match user_ref {
      UserRef::Id(r) => (r.id, false),
      UserRef::Username(r) => {
        let uid = self
          .users_by_username
          .get(&r.username)? // Never used
          .at(time)? // time < firstUse
          .value();
        let uid = (*uid)?; // unused at `time`
        (uid, true)
      }
      UserRef::Email(r) => {
        let uid = self
          .users_by_email
          .get(&r.email)? // Never used
          .at(time)? // time < firstUse
          .value();
        let uid = (*uid)?; // unused at `time`
        (uid, true)
      }
    })
  }

  fn get(&self, user_ref: &UserRef, time: Option<Instant>) -> Option<&MemUser> {
    let (uid, must_exist) = self.ref_to_id(user_ref, time)?;
    let user = self.users.get(&uid);
    if must_exist {
      assert!(user.is_some())
    }
    user
  }

  fn update(&mut self, options: &UpdateUserOptions, now: Instant) -> Result<&MemUser, UpdateUserError> {
    let user = self.users.get_mut(&options.r#ref.id);
    let user = match user {
      Some(u) => u,
      None => return Err(UpdateUserError::NotFound(options.r#ref)),
    };
    if options.patch.display_name.is_some() {
      let lock_period = user.display_name.time()..(user.display_name.time() + *USER_DISPLAY_NAME_LOCK_DURATION);
      if lock_period.contains(&now) {
        return Err(UpdateUserError::LockedDisplayName(
          options.r#ref,
          lock_period.into(),
          now,
        ));
      }
    }
    if options.patch.username.is_some() {
      let lock_period = user.username.time()..(user.username.time() + *USERNAME_LOCK_DURATION);
      if lock_period.contains(&now) {
        return Err(UpdateUserError::LockedUsername(options.r#ref, lock_period.into(), now));
      }
    }
    if options.patch.password.is_some() {
      let lock_period = user.password.time()..(user.password.time() + *USER_PASSWORD_LOCK_DURATION);
      if lock_period.contains(&now) {
        return Err(UpdateUserError::LockedPassword(options.r#ref, lock_period.into(), now));
      }
    }
    if let Some(display_name) = &options.patch.display_name {
      user.display_name.set(now, display_name.clone());
    }
    if let Some(username) = &options.patch.username {
      user.username.set(now, username.clone());
    }
    if let Some(password) = &options.patch.password {
      user.password.set(now, password.clone());
    }
    Ok(user)
  }

  fn hard_delete(&mut self, user_ref: UserIdRef) -> Result<MemUser, DeleteUserError> {
    let user = self.users.remove(&user_ref.id);
    let user = match user {
      Some(u) => u,
      None => return Err(DeleteUserError::NotFound(user_ref)),
    };
    let mut usernames: HashSet<&Username> = HashSet::new();
    for snapshot in user.username.iter() {
      if let Some(username) = snapshot.value() {
        usernames.insert(username);
      }
    }
    for username in usernames {
      let history = self.users_by_username.get_mut(username).unwrap();
      *history = history.map(|snapshot| snapshot.value().filter(|uid| *uid != user.id));
    }
    Ok(user)
  }
}

pub(crate) struct MemUser {
  id: UserId,
  created_at: Instant,
  display_name: Temporal<UserDisplayName>,
  email_address: Temporal<Option<EmailAddress>>,
  username: Temporal<Option<Username>>,
  password: Temporal<Option<PasswordHash>>,
  is_administrator: bool,
}

impl MemUser {
  fn at(&self, time: Option<Instant>) -> MemUserSnapshot {
    if let Some(time) = time {
      assert!(self.created_at <= time);
    }
    MemUserSnapshot { user: self, time }
  }
}

pub struct MemUserStore<TyClock: Clock, TyUuidGenerator: UuidGenerator> {
  pub(crate) clock: TyClock,
  pub(crate) uuid_generator: TyUuidGenerator,
  pub(crate) state: RwLock<StoreState>,
}

impl<TyClock, TyUuidGenerator> MemUserStore<TyClock, TyUuidGenerator>
where
  TyClock: Clock,
  TyUuidGenerator: UuidGenerator,
{
  pub fn new(clock: TyClock, uuid_generator: TyUuidGenerator) -> Self {
    Self {
      clock,
      uuid_generator,
      state: RwLock::new(StoreState::new()),
    }
  }
}

#[async_trait]
impl<TyClock, TyUuidGenerator> UserStore for MemUserStore<TyClock, TyUuidGenerator>
where
  TyClock: Clock,
  TyUuidGenerator: UuidGenerator,
{
  async fn create_user(&self, options: &CreateUserOptions) -> Result<CompleteSimpleUser, Box<dyn Error>> {
    let user_id = UserId::from(self.uuid_generator.next());
    let time = self.clock.now();
    let mut state = self.state.write().unwrap();
    let mem_user = state.create(time, user_id, options);
    let user: CompleteSimpleUser = mem_user.at(None).into();
    Ok(user)
  }

  async fn get_user(&self, options: &GetUserOptions) -> Result<Option<GetUserResult>, Box<dyn Error>> {
    let state = &self.state.read().unwrap();

    let mem_user: Option<&MemUser> = state.get(&options.r#ref, options.time);

    Ok(mem_user.map(|u| u.at(options.time)).map(|user| match options.fields {
      UserFields::Complete => GetUserResult::Complete(user.into()),
      UserFields::CompleteIfSelf { self_user_id } => {
        if self_user_id == user.user.id {
          GetUserResult::Complete(user.into())
        } else {
          GetUserResult::Default(user.into())
        }
      }
      UserFields::Default => GetUserResult::Default(user.into()),
      UserFields::Short => GetUserResult::Short(user.into()),
    }))
  }

  async fn get_user_with_password(
    &self,
    options: &GetUserOptions,
  ) -> Result<Option<ShortUserWithPassword>, Box<dyn Error>> {
    let state = &self.state.read().unwrap();

    let mem_user: Option<&MemUser> = state.get(&options.r#ref, options.time);

    Ok(mem_user.map(|u| u.at(options.time)).map(|user| {
      let password = user.user.password.value_ref().clone();
      let short: ShortUser = user.into();
      ShortUserWithPassword {
        id: short.id,
        display_name: short.display_name,
        password,
      }
    }))
  }

  async fn get_short_user(&self, options: &GetShortUserOptions) -> Result<Option<ShortUser>, Box<dyn Error>> {
    let state = &self.state.read().unwrap();
    let mem_user: Option<&MemUser> = state.get(&options.r#ref, options.time);
    Ok(mem_user.map(|u| u.at(options.time)).map(ShortUser::from))
  }

  async fn update_user(&self, options: &UpdateUserOptions) -> Result<CompleteSimpleUser, UpdateUserError> {
    let mut state = self.state.write().unwrap();
    let user = state.update(options, self.clock.now())?;
    Ok(user.at(None).into())
  }

  async fn hard_delete_user(&self, user_ref: UserIdRef) -> Result<(), DeleteUserError> {
    let mut state = self.state.write().unwrap();
    let _user = state.hard_delete(user_ref)?;
    Ok(())
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyUuidGenerator> neon::prelude::Finalize for MemUserStore<TyClock, TyUuidGenerator>
where
  TyClock: Clock,
  TyUuidGenerator: UuidGenerator,
{
}

#[cfg(test)]
mod test {
  use crate::mem::MemUserStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::user::UserStore;
  use etwin_core::uuid::Uuid4Generator;
  use std::sync::Arc;

  fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn UserStore>> {
    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let uuid_generator = Arc::new(Uuid4Generator);
    let user_store: Arc<dyn UserStore> = Arc::new(MemUserStore::new(clock.clone(), uuid_generator));

    TestApi { clock, user_store }
  }

  test_user_store!(|| make_test_api());
}
