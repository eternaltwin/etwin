use async_trait::async_trait;
use chrono::{DateTime, Utc};
use core::ops::Deref;
use etwin_core::clock::Clock;
use etwin_core::email::EmailAddress;
use etwin_core::user::{
  CompleteSimpleUser, CreateUserOptions, GetUserOptions, SimpleUser, UserDisplayName, UserDisplayNameVersion,
  UserDisplayNameVersions, UserId, UserStore, Username,
};
use etwin_core::uuid::UuidGenerator;
use std::collections::HashMap;
use std::error::Error;
use std::sync::Mutex;

pub(crate) struct InMemoryUser {
  id: UserId,
  ctime: DateTime<Utc>,
  display_name: UserDisplayName,
  display_name_mtime: DateTime<Utc>,
  email_address: Option<EmailAddress>,
  email_address_mtime: DateTime<Utc>,
  username: Option<Username>,
  username_mtime: DateTime<Utc>,
  is_administrator: bool,
}

impl From<&InMemoryUser> for SimpleUser {
  fn from(im_user: &InMemoryUser) -> Self {
    SimpleUser {
      id: im_user.id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: im_user.display_name.clone(),
        },
      },
      is_administrator: im_user.is_administrator,
    }
  }
}

impl From<&InMemoryUser> for CompleteSimpleUser {
  fn from(im_user: &InMemoryUser) -> Self {
    let simple: SimpleUser = im_user.into();
    CompleteSimpleUser {
      id: simple.id,
      display_name: simple.display_name,
      is_administrator: simple.is_administrator,
      ctime: im_user.ctime,
      username: im_user.username.clone(),
      email_address: im_user.email_address.clone(),
    }
  }
}

pub struct InMemorySimpleUserService<C, U>
where
  C: Deref + Send + Sync,
  <C as Deref>::Target: Clock,
  U: Deref + Send + Sync,
  <U as Deref>::Target: UuidGenerator,
{
  pub(crate) clock: C,
  pub(crate) uuid_generator: U,
  pub(crate) users: Mutex<HashMap<UserId, InMemoryUser>>,
}

impl<C, U> InMemorySimpleUserService<C, U>
where
  C: Deref + Send + Sync,
  <C as Deref>::Target: Clock,
  U: Deref + Send + Sync,
  <U as Deref>::Target: UuidGenerator,
{
  pub fn new(clock: C, uuid_generator: U) -> Self {
    Self {
      clock,
      uuid_generator,
      users: Mutex::new(HashMap::new()),
    }
  }
}

#[async_trait]
impl<C, U> UserStore for InMemorySimpleUserService<C, U>
where
  C: Deref + Send + Sync,
  <C as Deref>::Target: Clock,
  U: Deref + Send + Sync,
  <U as Deref>::Target: UuidGenerator,
{
  async fn create_user(&self, options: &CreateUserOptions) -> Result<CompleteSimpleUser, Box<dyn Error>> {
    let user_id = UserId::from((*self.uuid_generator).next());
    let time = self.clock.now();
    let mut users = self.users.lock().unwrap();
    let im_user = InMemoryUser {
      id: user_id,
      ctime: time,
      display_name: options.display_name.clone(),
      display_name_mtime: time,
      email_address: options.email.clone(),
      email_address_mtime: time,
      username: options.username.clone(),
      username_mtime: time,
      is_administrator: users.is_empty(),
    };
    let user: CompleteSimpleUser = (&im_user).into();
    let old = users.insert(user_id, im_user);
    assert!(old.is_none());
    Ok(user)
  }

  async fn get_user(&self, options: &GetUserOptions) -> Result<Option<SimpleUser>, Box<dyn Error>> {
    let users = self.users.lock().unwrap();
    Ok(users.get(&options.id).map(SimpleUser::from))
  }

  async fn get_complete_user(&self, options: &GetUserOptions) -> Result<Option<CompleteSimpleUser>, Box<dyn Error>> {
    let users = self.users.lock().unwrap();
    Ok(users.get(&options.id).map(CompleteSimpleUser::from))
  }
}

#[cfg(test)]
mod test {
  use crate::memory::InMemorySimpleUserService;
  use crate::test::{test_register_the_admin_and_retrieve_ref, TestApi};
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::user::UserStore;
  use etwin_core::uuid::Uuid4Generator;
  use std::sync::Arc;

  fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn UserStore>> {
    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let uuid_generator = Arc::new(Uuid4Generator);
    let user_store: Arc<dyn UserStore> = Arc::new(InMemorySimpleUserService::new(clock.clone(), uuid_generator));

    TestApi {
      clock: clock,
      user_store: user_store,
    }
  }

  #[tokio::test]
  async fn test_user_store() {
    let api = make_test_api();
    test_register_the_admin_and_retrieve_ref(api).await;
  }
}
