use async_trait::async_trait;
use etwin_core::user::{GetUserOptions, UserId, UserStore, CreateUserOptions, SimpleUser, CompleteSimpleUser, UserDisplayNameVersions, UserDisplayNameVersion};
use std::error::Error;
use sqlx::postgres::PgPool;
use etwin_core::clock::Clock;
use etwin_core::uuid::UuidGenerator;

pub struct PgUserStore<'a, C, U>
  where
    C: Clock + ?Sized,
    U: UuidGenerator + ?Sized,
{
  clock: &'a C,
  database: &'a PgPool,
  uuid_generator: &'a U,
}

impl<'a, C, U> PgUserStore<'a, C, U>
  where
    C: Clock + ?Sized,
    U: UuidGenerator + ?Sized
{
  pub fn new(
    clock: &'a C,
    database: &'a PgPool,
    uuid_generator: &'a U,
  ) -> Self {
    Self {
      clock,
      database,
      uuid_generator,
    }
  }
}

#[async_trait]
impl<'a, C, U> UserStore for PgUserStore<'a, C, U>
  where
    C: Clock + ?Sized,
    U: UuidGenerator + ?Sized
{
  async fn create_user(&self, options: &CreateUserOptions) -> Result<CompleteSimpleUser, Box<dyn Error>> {
    let user_id = self.uuid_generator.next();

    let row = sqlx::query!(r"
      WITH administrator_exists AS (SELECT 1 FROM users WHERE is_administrator)
      INSERT
      INTO users(
        user_id, ctime, display_name, display_name_mtime,
        email_address, email_address_mtime,
        username, username_mtime,
        password, password_mtime,
        is_administrator
      )
      VALUES (
        $2::UUID, NOW(), $3::VARCHAR, NOW(),
        (CASE WHEN $4::TEXT IS NULL THEN NULL ELSE pgp_sym_encrypt($4::TEXT, $1::TEXT) END), NOW(),
        $5::VARCHAR, NOW(),
        NULL, NOW(),
        (NOT EXISTS(SELECT 1 FROM administrator_exists))
      )
      RETURNING user_id, display_name, is_administrator;
    ",
      "dev_secret", user_id, options.display_name.as_str(), options.username.as_ref().map(|x| x.as_str()), None::<&str>
    )
      .fetch_one(self.database)
      .await?;

    let user = CompleteSimpleUser {
      id: UserId::from_uuid(user_id),
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: options.display_name.clone()
        }
      },
      is_administrator: row.is_administrator,
      ctime: self.clock.now(),
      username: options.username.clone(),
      email_address: None
    };

    Ok(user)
  }

  async fn get_user(&self, _options: &GetUserOptions) -> Result<Option<SimpleUser>, Box<dyn Error>> {
    unimplemented!()
  }

  async fn get_complete_user(&self, _options: &GetUserOptions) -> Result<Option<CompleteSimpleUser>, Box<dyn Error>> {
    unimplemented!()
  }
}

#[cfg(test)]
mod test {
  use etwin_core::clock::VirtualClock;
  use chrono::{Utc, TimeZone};
  use etwin_core::uuid::Uuid4Generator;
  use crate::test::{TestApi, test_register_the_admin_and_retrieve_ref};
  use etwin_core::async_fn::AsyncFnOnce;
  use sqlx::PgPool;
  use sqlx::postgres::PgPoolOptions;
  use super::PgUserStore;
  use etwin_db_schema::force_create_latest;

  async fn with_test_api<F, R>(f: F) -> R
    where
      F: for<'a> AsyncFnOnce<TestApi<'a>, Output = R>,
  {
    let database: PgPool = PgPoolOptions::new()
      .max_connections(5)
      .connect("postgresql://etwin:dev@localhost:5432/etwindb")
      .await
      .unwrap();

    force_create_latest(&database).await.unwrap();

    let clock = VirtualClock::new(Utc.timestamp(1607531946, 0));
    let uuid_generator = Uuid4Generator;
    let user_store = PgUserStore::new(&clock, &database, &uuid_generator);

    let api = TestApi {
      clock: &clock,
      user_store: &user_store,
    };

    f.call_once(api).await
  }

  #[tokio::test]
  async fn test_pg_user_store() {
    with_test_api(test_register_the_admin_and_retrieve_ref).await;
  }
}
