use async_trait::async_trait;
use core::ops::Deref;
use etwin_core::clock::Clock;
use etwin_core::user::{
  CompleteSimpleUser, CreateUserOptions, GetUserOptions, SimpleUser, UserDisplayNameVersion, UserDisplayNameVersions,
  UserId, UserStore,
};
use etwin_core::uuid::UuidGenerator;
use sqlx::postgres::PgPool;
use std::error::Error;

pub struct PgUserStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Deref + Send + Sync,
  <TyClock as Deref>::Target: Clock,
  TyDatabase: Deref<Target = PgPool> + Send + Sync,
  TyUuidGenerator: Deref + Send + Sync,
  <TyUuidGenerator as Deref>::Target: UuidGenerator,
{
  clock: TyClock,
  database: TyDatabase,
  uuid_generator: TyUuidGenerator,
}

impl<TyClock, TyDatabase, TyUuidGenerator> PgUserStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Deref + Send + Sync,
  <TyClock as Deref>::Target: Clock,
  TyDatabase: Deref<Target = PgPool> + Send + Sync,
  TyUuidGenerator: Deref + Send + Sync,
  <TyUuidGenerator as Deref>::Target: UuidGenerator,
{
  pub fn new(clock: TyClock, database: TyDatabase, uuid_generator: TyUuidGenerator) -> Self {
    Self {
      clock,
      database,
      uuid_generator,
    }
  }
}

#[async_trait]
impl<TyClock, TyDatabase, TyUuidGenerator> UserStore for PgUserStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Deref + Send + Sync,
  <TyClock as Deref>::Target: Clock,
  TyDatabase: Deref<Target = PgPool> + Send + Sync,
  TyUuidGenerator: Deref + Send + Sync,
  <TyUuidGenerator as Deref>::Target: UuidGenerator,
{
  async fn create_user(&self, options: &CreateUserOptions) -> Result<CompleteSimpleUser, Box<dyn Error>> {
    let user_id = (*self.uuid_generator).next();

    let row = sqlx::query!(
      r"
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
      "dev_secret",
      user_id,
      options.display_name.as_str(),
      options.username.as_ref().map(|x| x.as_str()),
      None::<&str>
    )
    .fetch_one(&*self.database)
    .await?;

    let user = CompleteSimpleUser {
      id: UserId::from_uuid(user_id),
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: options.display_name.clone(),
        },
      },
      is_administrator: row.is_administrator,
      ctime: self.clock.now(),
      username: options.username.clone(),
      email_address: None,
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
  use super::PgUserStore;
  use crate::test::{test_register_the_admin_and_retrieve_ref, TestApi};
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::user::UserStore;
  use etwin_core::uuid::Uuid4Generator;
  use etwin_db_schema::force_create_latest;
  use sqlx::postgres::PgPoolOptions;
  use sqlx::PgPool;
  use std::sync::Arc;

  async fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn UserStore>> {
    let database: PgPool = PgPoolOptions::new()
      .max_connections(5)
      .connect("postgresql://etwin:dev@localhost:5432/etwindb")
      .await
      .unwrap();
    force_create_latest(&database).await.unwrap();

    let database = Arc::new(database);

    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let uuid_generator = Arc::new(Uuid4Generator);
    let user_store: Arc<dyn UserStore> = Arc::new(PgUserStore::new(clock.clone(), database, uuid_generator));

    TestApi {
      clock: clock,
      user_store: user_store,
    }
  }

  #[tokio::test]
  async fn test_pg_user_store() {
    let api = make_test_api().await;
    test_register_the_admin_and_retrieve_ref(api).await;
  }
}
