use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::clock::Clock;
use etwin_core::core::Instant;
use etwin_core::twinoid::{
  ArchivedTwinoidUser, GetTwinoidUserOptions, ShortTwinoidUser, TwinoidStore, TwinoidUserDisplayName, TwinoidUserId,
};
use etwin_core::types::EtwinError;
use sqlx::PgPool;

pub struct PgTwinoidStore<TyClock, TyDatabase>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
{
  clock: TyClock,
  database: TyDatabase,
}

impl<TyClock, TyDatabase> PgTwinoidStore<TyClock, TyDatabase>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
{
  pub fn new(clock: TyClock, database: TyDatabase) -> Self {
    Self { clock, database }
  }
}

#[async_trait]
impl<TyClock, TyDatabase> TwinoidStore for PgTwinoidStore<TyClock, TyDatabase>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
{
  async fn get_short_user(&self, options: &GetTwinoidUserOptions) -> Result<Option<ShortTwinoidUser>, EtwinError> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      twinoid_user_id: TwinoidUserId,
      name: TwinoidUserDisplayName,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
      SELECT twinoid_user_id, name
      FROM twinoid_users
      WHERE twinoid_user_id = $1::TWINOID_USER_ID;
    ",
    )
    .bind(&options.id)
    .fetch_optional(self.database.as_ref())
    .await?;

    Ok(row.map(|r| ShortTwinoidUser {
      id: r.twinoid_user_id,
      display_name: r.name,
    }))
  }

  async fn get_user(&self, options: &GetTwinoidUserOptions) -> Result<Option<ArchivedTwinoidUser>, EtwinError> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      twinoid_user_id: TwinoidUserId,
      archived_at: Instant,
      name: TwinoidUserDisplayName,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
      SELECT twinoid_user_id, name, archived_at
      FROM twinoid_users
      WHERE twinoid_user_id = $1::TWINOID_USER_ID;
    ",
    )
    .bind(&options.id)
    .fetch_optional(self.database.as_ref())
    .await?;

    Ok(row.map(|r| ArchivedTwinoidUser {
      id: r.twinoid_user_id,
      archived_at: r.archived_at,
      display_name: r.name,
    }))
  }

  async fn touch_short_user(&self, short: &ShortTwinoidUser) -> Result<ArchivedTwinoidUser, EtwinError> {
    let now = self.clock.now();
    sqlx::query(
      r"
      INSERT INTO twinoid_users(twinoid_user_id, name, archived_at)
      VALUES ($1::TWINOID_USER_ID, $2::TWINOID_USER_DISPLAY_NAME, $3::INSTANT)
        ON CONFLICT (twinoid_user_id)
          DO UPDATE SET name = $2::TWINOID_USER_DISPLAY_NAME;
    ",
    )
    .bind(&short.id)
    .bind(&short.display_name)
    .bind(now)
    .execute(self.database.as_ref())
    .await?;
    Ok(ArchivedTwinoidUser {
      id: short.id,
      archived_at: now,
      display_name: short.display_name.clone(),
    })
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyDatabase> neon::prelude::Finalize for PgTwinoidStore<TyClock, TyDatabase>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
{
}

#[cfg(test)]
mod test {
  use super::PgTwinoidStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::twinoid::TwinoidStore;
  use etwin_db_schema::force_create_latest;
  use serial_test::serial;
  use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
  use sqlx::PgPool;
  use std::sync::Arc;

  async fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn TwinoidStore>> {
    let config = etwin_config::find_config(std::env::current_dir().unwrap()).unwrap();
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
    force_create_latest(&database, true).await.unwrap();

    let database = Arc::new(database);

    let clock = Arc::new(VirtualClock::new(Utc.ymd(2020, 1, 1).and_hms(0, 0, 0)));
    let twinoid_store: Arc<dyn TwinoidStore> = Arc::new(PgTwinoidStore::new(Arc::clone(&clock), Arc::clone(&database)));

    TestApi { clock, twinoid_store }
  }

  #[tokio::test]
  #[serial]
  async fn test_empty() {
    crate::test::test_empty(make_test_api().await).await;
  }

  #[tokio::test]
  #[serial]
  async fn test_touch_user() {
    crate::test::test_touch_user(make_test_api().await).await;
  }

  #[tokio::test]
  #[serial]
  async fn test_get_missing_user() {
    crate::test::test_get_missing_user(make_test_api().await).await;
  }
}
