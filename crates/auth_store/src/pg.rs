use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::auth::{
  AuthStore, CreateSessionOptions, CreateValidatedEmailVerificationOptions, RawSession, SessionId,
};
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, Secret};
use etwin_core::types::EtwinError;
use etwin_core::user::UserId;
use etwin_core::uuid::UuidGenerator;
use sqlx::PgPool;

pub struct PgAuthStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  clock: TyClock,
  database: TyDatabase,
  uuid_generator: TyUuidGenerator,
  #[allow(unused)]
  database_secret: Secret,
}

impl<TyClock, TyDatabase, TyUuidGenerator> PgAuthStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  pub fn new(clock: TyClock, database: TyDatabase, uuid_generator: TyUuidGenerator, database_secret: Secret) -> Self {
    Self {
      clock,
      database,
      uuid_generator,
      database_secret,
    }
  }
}

#[async_trait]
impl<TyClock, TyDatabase, TyUuidGenerator> AuthStore for PgAuthStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  async fn create_validated_email_verification(
    &self,
    _options: &CreateValidatedEmailVerificationOptions,
  ) -> Result<(), EtwinError> {
    eprintln!("Warning: PgAuthStore#create_validated_email_verification is a no-op stub");
    Ok(())
  }

  async fn create_session(&self, options: &CreateSessionOptions) -> Result<RawSession, EtwinError> {
    let session_id = SessionId::from_uuid(self.uuid_generator.next());
    let now = self.clock.now();

    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      ctime: Instant,
    }

    let row: Row = sqlx::query_as::<_, Row>(
      r"
          INSERT INTO sessions(
            session_id, user_id, ctime, atime, data
          )
          VALUES (
            $1::SESSION_ID, $2::USER_ID, $3::INSTANT, $3::INSTANT, '{}'
          )
          RETURNING ctime;
          ",
    )
    .bind(session_id)
    .bind(options.user.id)
    .bind(now)
    .fetch_one(self.database.as_ref())
    .await?;
    Ok(RawSession {
      id: session_id,
      user: options.user,
      ctime: row.ctime,
      atime: row.ctime,
    })
  }

  async fn get_and_touch_session(&self, session: SessionId) -> Result<Option<RawSession>, EtwinError> {
    let now = self.clock.now();

    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      ctime: Instant,
      atime: Instant,
      user_id: UserId,
    }

    let row = sqlx::query_as::<_, Row>(
      r"
      UPDATE sessions
      SET atime = $2::INSTANT
      WHERE session_id = $1::SESSION_ID
      RETURNING sessions.ctime, sessions.atime, sessions.user_id;
      ",
    )
    .bind(session)
    .bind(now)
    .fetch_optional(self.database.as_ref())
    .await?;

    Ok(row.map(|row| RawSession {
      id: session,
      user: row.user_id.into(),
      ctime: row.ctime,
      atime: row.ctime,
    }))
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyDatabase, TyUuidGenerator> neon::prelude::Finalize for PgAuthStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
}

#[cfg(test)]
mod test {
  use super::PgAuthStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::auth::AuthStore;
  use etwin_core::clock::VirtualClock;
  use etwin_core::core::Secret;
  use etwin_core::user::UserStore;
  use etwin_core::uuid::Uuid4Generator;
  use etwin_db_schema::force_create_latest;
  use etwin_user_store::pg::PgUserStore;
  use serial_test::serial;
  use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
  use sqlx::PgPool;
  use std::sync::Arc;

  async fn make_test_api() -> TestApi<Arc<dyn AuthStore>, Arc<VirtualClock>, Arc<dyn UserStore>> {
    let config = etwin_config::find_config(std::env::current_dir().unwrap()).unwrap();
    let admin_database: PgPool = PgPoolOptions::new()
      .max_connections(5)
      .connect_with(
        PgConnectOptions::new()
          .host(&config.db.host)
          .port(config.db.port)
          .database(&config.db.name)
          .username(&config.db.admin_user)
          .password(&config.db.admin_password),
      )
      .await
      .unwrap();
    force_create_latest(&admin_database, true).await.unwrap();
    admin_database.close().await;

    let database: PgPool = PgPoolOptions::new()
      .max_connections(5)
      .connect_with(
        PgConnectOptions::new()
          .host(&config.db.host)
          .port(config.db.port)
          .database(&config.db.name)
          .username(&config.db.user)
          .password(&config.db.password),
      )
      .await
      .unwrap();
    let database = Arc::new(database);

    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let database_secret = Secret::new("dev_secret".to_string());
    let uuid_generator = Arc::new(Uuid4Generator);
    let auth_store: Arc<dyn AuthStore> = Arc::new(PgAuthStore::new(
      Arc::clone(&clock),
      Arc::clone(&database),
      uuid_generator,
      database_secret.clone(),
    ));

    let user_store: Arc<dyn UserStore> = Arc::new(PgUserStore::new(
      Arc::clone(&clock),
      Arc::clone(&database),
      database_secret,
      Uuid4Generator,
    ));

    TestApi {
      auth_store,
      clock,
      user_store,
    }
  }

  test_dinoparc_store!(
    #[serial]
    || make_test_api().await
  );
}
