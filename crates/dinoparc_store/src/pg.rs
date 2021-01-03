use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::dinoparc::{
  DinoparcServer, DinoparcStore, DinoparcUserId, DinoparcUsername, GetDinoparcUserOptions, ShortDinoparcUser,
};
use sqlx;
use sqlx::PgPool;
use std::error::Error;
use std::ops::Deref;

pub struct PgDinoparcStore<TyClock, TyDatabase>
where
  TyClock: Deref + Send + Sync,
  <TyClock as Deref>::Target: Clock,
  TyDatabase: Deref<Target = PgPool> + Send + Sync,
{
  clock: TyClock,
  database: TyDatabase,
}

impl<TyClock, TyDatabase> PgDinoparcStore<TyClock, TyDatabase>
where
  TyClock: Deref + Send + Sync,
  <TyClock as Deref>::Target: Clock,
  TyDatabase: Deref<Target = PgPool> + Send + Sync,
{
  pub fn new(clock: TyClock, database: TyDatabase) -> Self {
    Self { clock, database }
  }
}

#[async_trait]
impl<TyClock, TyDatabase> DinoparcStore for PgDinoparcStore<TyClock, TyDatabase>
where
  TyClock: Deref + Send + Sync,
  <TyClock as Deref>::Target: Clock,
  TyDatabase: Deref<Target = PgPool> + Send + Sync,
{
  async fn get_short_user(
    &self,
    options: &GetDinoparcUserOptions,
  ) -> Result<Option<ShortDinoparcUser>, Box<dyn Error>> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      dinoparc_server: DinoparcServer,
      dinoparc_user_id: DinoparcUserId,
      username: DinoparcUsername,
    }

    let row = sqlx::query_as::<_, Row>(
      r"
      SELECT dinoparc_server, dinoparc_user_id, username
      FROM dinoparc_users
      WHERE dinoparc_server = $1::DINOPARC_SERVER AND dinoparc_user_id = $2::DINOPARC_USER_ID;
    ",
    )
    .bind(&options.server)
    .bind(&options.id)
    .fetch_optional(&*self.database)
    .await?;

    Ok(row.map(|r| ShortDinoparcUser {
      server: r.dinoparc_server,
      id: r.dinoparc_user_id,
      username: r.username,
    }))
  }

  async fn touch_short_user(&self, short: &ShortDinoparcUser) -> Result<ShortDinoparcUser, Box<dyn Error>> {
    let now = self.clock.now();
    sqlx::query(
      r"
      INSERT INTO dinoparc_users(dinoparc_server, dinoparc_user_id, username, archived_at)
      VALUES ($1::DINOPARC_SERVER, $2::DINOPARC_USER_ID, $3::DINOPARC_USERNAME, $4::INSTANT)
        ON CONFLICT (dinoparc_server, dinoparc_user_id)
          DO UPDATE SET username = $3::DINOPARC_USERNAME;
    ",
    )
    .bind(&short.server)
    .bind(&short.id)
    .bind(&short.username)
    .bind(now)
    .fetch_optional(&*self.database)
    .await?;
    Ok(ShortDinoparcUser {
      server: short.server,
      id: short.id.clone(),
      username: short.username.clone(),
    })
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyDatabase> neon::prelude::Finalize for PgDinoparcStore<TyClock, TyDatabase>
where
  TyClock: Deref + Send + Sync,
  <TyClock as Deref>::Target: Clock,
  TyDatabase: Deref<Target = PgPool> + Send + Sync,
{
}

#[cfg(test)]
mod test {
  use super::PgDinoparcStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::dinoparc::DinoparcStore;
  use etwin_db_schema::force_create_latest;
  use serial_test::serial;
  use sqlx::postgres::PgPoolOptions;
  use sqlx::PgPool;
  use std::sync::Arc;

  async fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn DinoparcStore>> {
    let database: PgPool = PgPoolOptions::new()
      .max_connections(5)
      .connect("postgresql://etwin:dev@localhost:5432/etwindb")
      .await
      .unwrap();
    force_create_latest(&database).await.unwrap();

    let database = Arc::new(database);

    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let dinoparc_store: Arc<dyn DinoparcStore> =
      Arc::new(PgDinoparcStore::new(Arc::clone(&clock), Arc::clone(&database)));

    TestApi {
      _clock: clock,
      dinoparc_store,
    }
  }

  #[tokio::test]
  #[serial]
  async fn test_empty() {
    crate::test::test_empty(make_test_api().await).await;
  }

  // #[tokio::test]
  // #[serial]
  // async fn test_touch_user() {
  //   crate::test::test_touch_user(make_test_api().await).await;
  // }
}
