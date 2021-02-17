use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::core::Instant;
use etwin_core::email::EmailAddress;
use etwin_core::password::PasswordHash;
use etwin_core::user::{
  CompleteSimpleUser, CreateUserOptions, GetShortUserOptions, GetUserOptions, GetUserResult, ShortUser,
  ShortUserWithPassword, SimpleUser, UserDisplayName, UserDisplayNameVersion, UserDisplayNameVersions, UserFields,
  UserId, UserIdRef, UserRef, UserStore, Username,
};
use etwin_core::uuid::UuidGenerator;
use std::collections::HashMap;
use std::error::Error;
use std::sync::Mutex;

pub(crate) struct MemUser {
  id: UserId,
  ctime: Instant,
  display_name: UserDisplayName,
  email_address: Option<EmailAddress>,
  username: Option<Username>,
  password: Option<PasswordHash>,
  is_administrator: bool,
}

impl From<&MemUser> for ShortUser {
  fn from(mem_user: &MemUser) -> Self {
    Self {
      id: mem_user.id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: mem_user.display_name.clone(),
        },
      },
    }
  }
}

impl From<&MemUser> for SimpleUser {
  fn from(mem_user: &MemUser) -> Self {
    Self {
      id: mem_user.id,
      created_at: mem_user.ctime,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: mem_user.display_name.clone(),
        },
      },
      is_administrator: mem_user.is_administrator,
    }
  }
}

impl From<&MemUser> for CompleteSimpleUser {
  fn from(mem_user: &MemUser) -> Self {
    let simple: SimpleUser = mem_user.into();
    Self {
      id: simple.id,
      display_name: simple.display_name,
      is_administrator: simple.is_administrator,
      created_at: mem_user.ctime,
      username: mem_user.username.clone(),
      email_address: mem_user.email_address.clone(),
    }
  }
}

pub struct MemUserStore<TyClock: Clock, TyUuidGenerator: UuidGenerator> {
  pub(crate) clock: TyClock,
  pub(crate) uuid_generator: TyUuidGenerator,
  pub(crate) users: Mutex<HashMap<UserId, MemUser>>,
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
      users: Mutex::new(HashMap::new()),
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
    let mut users = self.users.lock().unwrap();
    let im_user = MemUser {
      id: user_id,
      ctime: time,
      display_name: options.display_name.clone(),
      email_address: options.email.clone(),
      username: options.username.clone(),
      password: options.password.clone(),
      is_administrator: users.is_empty(),
    };
    let user: CompleteSimpleUser = (&im_user).into();
    let old = users.insert(user_id, im_user);
    assert!(old.is_none());
    Ok(user)
  }

  async fn get_user(&self, options: &GetUserOptions) -> Result<Option<GetUserResult>, Box<dyn Error>> {
    let users = self.users.lock().unwrap();

    let mem_user: Option<&MemUser> = match &options.r#ref {
      UserRef::Id(r) => users.get(&r.id),
      UserRef::Username(r) => users.values().find(|u| u.username.as_ref() == Some(&r.username)),
      UserRef::Email(r) => users.values().find(|u| u.email_address.as_ref() == Some(&r.email)),
    };

    Ok(mem_user.map(|user| match options.fields {
      UserFields::Complete => GetUserResult::Complete(user.into()),
      UserFields::CompleteIfSelf { self_user_id } => {
        if self_user_id == user.id {
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
    let users = self.users.lock().unwrap();

    let mem_user: Option<&MemUser> = match &options.r#ref {
      UserRef::Id(r) => users.get(&r.id),
      UserRef::Username(r) => users.values().find(|u| u.username.as_ref() == Some(&r.username)),
      UserRef::Email(r) => users.values().find(|u| u.email_address.as_ref() == Some(&r.email)),
    };

    Ok(mem_user.map(|user| {
      let password = user.password.clone();
      let short: ShortUser = user.into();
      ShortUserWithPassword {
        id: short.id,
        display_name: short.display_name,
        password,
      }
    }))
  }

  async fn get_short_user(&self, options: &GetShortUserOptions) -> Result<Option<ShortUser>, Box<dyn Error>> {
    let users = self.users.lock().unwrap();
    let mem_user: Option<&MemUser> = match &options.r#ref {
      UserRef::Id(r) => users.get(&r.id),
      UserRef::Username(r) => users.values().find(|u| u.username.as_ref() == Some(&r.username)),
      UserRef::Email(r) => users.values().find(|u| u.email_address.as_ref() == Some(&r.email)),
    };
    Ok(mem_user.map(ShortUser::from))
  }

  async fn hard_delete_user_by_id(&self, _user_ref: UserIdRef) -> Result<(), Box<dyn Error>> {
    unimplemented!()
  }

  // async fn get_complete_user(&self, options: &GetUserOptions) -> Result<Option<CompleteSimpleUser>, Box<dyn Error>> {
  //   let users = self.users.lock().unwrap();
  //   Ok(users.get(&options.id).map(CompleteSimpleUser::from))
  // }
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

  #[tokio::test]
  async fn test_create_admin() {
    crate::test::test_create_admin(make_test_api()).await;
  }

  #[tokio::test]
  async fn test_register_the_admin_and_retrieve_short() {
    crate::test::test_register_the_admin_and_retrieve_short(make_test_api()).await;
  }

  #[tokio::test]
  async fn test_register_the_admin_and_retrieve_default() {
    crate::test::test_register_the_admin_and_retrieve_default(make_test_api()).await;
  }

  #[tokio::test]
  async fn test_register_the_admin_and_retrieve_complete() {
    crate::test::test_register_the_admin_and_retrieve_complete(make_test_api()).await;
  }
}
