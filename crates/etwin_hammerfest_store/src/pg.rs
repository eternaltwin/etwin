use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::hammerfest::{HammerfestStore, HammerfestUserId, GetHammerfestUserOptions, ShortHammerfestUser, HammerfestServer, HammerfestUsername, ArchivedHammerfestUser};
use std::error::Error;
use std::ops::Deref;
use sqlx;
use sqlx::PgPool;

pub struct PgHammerfestStore<TyClock, TyDatabase>
  where
    TyClock: Deref + Send + Sync,
    <TyClock as Deref>::Target: Clock,
    TyDatabase: Deref<Target=PgPool> + Send + Sync,
{
  clock: TyClock,
  database: TyDatabase,
}

impl<TyClock, TyDatabase> PgHammerfestStore<TyClock, TyDatabase>
  where
    TyClock: Deref + Send + Sync,
    <TyClock as Deref>::Target: Clock,
    TyDatabase: Deref<Target=PgPool> + Send + Sync,
{
  pub fn new(clock: TyClock, database: TyDatabase) -> Self {
    Self {
      clock,
      database,
    }
  }
}

#[async_trait]
impl<TyClock, TyDatabase> HammerfestStore for PgHammerfestStore<TyClock, TyDatabase>
  where
    TyClock: Deref + Send + Sync,
    <TyClock as Deref>::Target: Clock,
    TyDatabase: Deref<Target=PgPool> + Send + Sync,
{
  async fn get_short_user(&self, options: &GetHammerfestUserOptions) -> Result<Option<ShortHammerfestUser>, Box<dyn Error>> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      hammerfest_server: HammerfestServer,
      hammerfest_user_id: HammerfestUserId,
      username: HammerfestUsername,
    }

    let row = sqlx::query_as::<_, Row>(
      r"
      SELECT hammerfest_server, hammerfest_user_id, username
      FROM hammerfest_users
      WHERE hammerfest_server = $1::HAMMERFEST_SERVER AND hammerfest_user_id = $2::HAMMERFEST_USER_ID;
    ")
      .bind(&options.server)
      .bind(&options.id)
      .fetch_optional(&*self.database)
      .await?;

    Ok(row.map(|r| {
      ShortHammerfestUser {
        server: r.hammerfest_server,
        id: r.hammerfest_user_id,
        username: r.username,
      }
    }))
  }

  async fn get_user(&self, options: &GetHammerfestUserOptions) -> Result<Option<ArchivedHammerfestUser>, Box<dyn Error>> {
    unimplemented!()
  }

  async fn touch_short_user(&self, short: &ShortHammerfestUser) -> Result<ArchivedHammerfestUser, Box<dyn Error>> {
    let now = self.clock.now();
    sqlx::query(
      r"
      INSERT INTO hammerfest_users(hammerfest_server, hammerfest_user_id, username, archived_at)
      VALUES ($1::HAMMERFEST_SERVER, $2::HAMMERFEST_USER_ID, $3::HAMMERFEST_USERNAME, $4::INSTANT)
        ON CONFLICT (hammerfest_server, hammerfest_user_id)
          DO UPDATE SET username = $3::HAMMERFEST_USERNAME;
    ")
      .bind(&short.server)
      .bind(&short.id)
      .bind(&short.username)
      .bind(now)
      .fetch_optional(&*self.database)
      .await?;
    Ok(ArchivedHammerfestUser {
      server: short.server,
      id: short.id.clone(),
      username: short.username.clone(),
      archived_at: now,
      profile: None,
      items: None
    })
  }
}

#[cfg(test)]
mod test {
  use crate::test::{TestApi};
  use etwin_core::clock::VirtualClock;
  use chrono::{TimeZone, Utc};
  use std::sync::Arc;
  use etwin_core::hammerfest::HammerfestStore;
  use super::PgHammerfestStore;
  use etwin_db_schema::force_create_latest;
  use sqlx::PgPool;
  use sqlx::postgres::PgPoolOptions;
  use serial_test::serial;

  async fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn HammerfestStore>> {
    let database: PgPool = PgPoolOptions::new()
      .max_connections(5)
      .connect("postgresql://etwin:dev@localhost:5432/etwindb")
      .await
      .unwrap();
    force_create_latest(&database).await.unwrap();

    let database = Arc::new(database);

    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let hammerfest_store: Arc<dyn HammerfestStore> = Arc::new(PgHammerfestStore::new(Arc::clone(&clock), Arc::clone(&database)));

    TestApi { _clock: clock, hammerfest_store }
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
}
