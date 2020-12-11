use async_trait::async_trait;
use etwin_core::user::{GetUserOptions, UserId, UserDisplayName, UserStore, CreateUserOptions, SimpleUser, UserDisplayNameVersions, UserDisplayNameVersion, Username, CompleteSimpleUser};
use std::error::Error;
use etwin_core::clock::Clock;
use std::collections::HashMap;
use std::sync::{Mutex};
use chrono::{DateTime, Utc};
use etwin_core::email::EmailAddress;
use etwin_core::uuid::UuidGenerator;

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

pub struct InMemorySimpleUserService<'a, C, U>
  where
    C: Clock + ?Sized,
    U: UuidGenerator + ?Sized,
{
  pub(crate) clock: &'a C,
  pub(crate) uuid_generator: &'a U,
  pub(crate) users: Mutex<HashMap<UserId, InMemoryUser>>,
}

impl<'a, C, U> InMemorySimpleUserService<'a, C, U>
  where
    C: Clock + ?Sized,
    U: UuidGenerator + ?Sized
{
  pub fn new(
    clock: &'a C,
    uuid_generator: &'a U,
  ) -> Self {
    Self {
      clock,
      uuid_generator,
      users: Mutex::new(HashMap::new()),
    }
  }
}

#[async_trait]
impl<'a, C, U> UserStore for InMemorySimpleUserService<'a, C, U>
  where
    C: Clock + ?Sized,
    U: UuidGenerator + ?Sized
{
  async fn create_user(&self, options: &CreateUserOptions) -> Result<CompleteSimpleUser, Box<dyn Error>> {
    let user_id = UserId::from(self.uuid_generator.next());
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
  use etwin_core::clock::VirtualClock;
  use chrono::{Utc, TimeZone};
  use crate::memory::InMemorySimpleUserService;
  use etwin_core::uuid::Uuid4Generator;
  use crate::test::{TestApi, test_register_the_admin_and_retrieve_ref};
  use etwin_core::async_fn::AsyncFnOnce;

  async fn with_test_api<F, R>(f: F) -> R
    where
      F: for<'a> AsyncFnOnce<TestApi<'a>, Output = R>,
  {
    let clock = VirtualClock::new(Utc.timestamp(1607531946, 0));
    let uuid_generator = Uuid4Generator;
    let user_store = InMemorySimpleUserService::new(&clock, &uuid_generator);

    let api = TestApi {
      clock: &clock,
      user_store: &user_store,
    };

    f.call_once(api).await
  }

  #[tokio::test]
  async fn test_user_store() {
    with_test_api(test_register_the_admin_and_retrieve_ref).await;
  }
}
