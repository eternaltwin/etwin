use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, RawUserDot};
use etwin_core::dinoparc::DinoparcUserIdRef;
use etwin_core::hammerfest::{
  ArchivedHammerfestUser, GetHammerfestUserOptions, HammerfestServer, HammerfestStore, HammerfestUserId,
  HammerfestUserIdRef, HammerfestUsername, ShortHammerfestUser,
};
use etwin_core::link::{GetLinkOptions, LinkStore, RawLink, TouchLinkError, TouchLinkOptions, VersionedRawLink};
use etwin_core::twinoid::TwinoidUserIdRef;
use etwin_core::user::{UserId, UserIdRef};
use sqlx;
use sqlx::PgPool;
use std::error::Error;

pub struct PgLinkStore<TyClock, TyDatabase>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
{
  clock: TyClock,
  database: TyDatabase,
}

impl<TyClock, TyDatabase> PgLinkStore<TyClock, TyDatabase>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
{
  pub fn new(clock: TyClock, database: TyDatabase) -> Self {
    Self { clock, database }
  }
}

#[async_trait]
impl<TyClock, TyDatabase> LinkStore for PgLinkStore<TyClock, TyDatabase>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
{
  async fn touch_dinoparc_link(
    &self,
    options: &TouchLinkOptions<DinoparcUserIdRef>,
  ) -> Result<VersionedRawLink<DinoparcUserIdRef>, TouchLinkError<DinoparcUserIdRef>> {
    unimplemented!()
  }

  async fn touch_hammerfest_link(
    &self,
    options: &TouchLinkOptions<HammerfestUserIdRef>,
  ) -> Result<VersionedRawLink<HammerfestUserIdRef>, TouchLinkError<HammerfestUserIdRef>> {
    let now = self.clock.now();

    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      linked_at: Instant,
      linked_by: UserId,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
        INSERT INTO hammerfest_user_links(user_id, hammerfest_server, hammerfest_user_id, linked_at, linked_by)
        VALUES ($1::USER_ID, $2::HAMMERFEST_SERVER, $3::HAMMERFEST_USER_ID,$4::INSTANT, $5::USER_ID)
        RETURNING linked_at, linked_by;
    ",
    )
    .bind(&options.etwin.id)
    .bind(&options.remote.server)
    .bind(&options.remote.id)
    .bind(&now)
    .bind(&options.linked_by.id)
    .fetch_optional(self.database.as_ref())
    .await
    .map_err(|e: sqlx::Error| TouchLinkError::Other(Box::new(e)))?;

    match row {
      None => Ok(VersionedRawLink {
        current: None,
        old: vec![],
      }),
      Some(row) => {
        let link: VersionedRawLink<HammerfestUserIdRef> = VersionedRawLink {
          current: Some(RawLink {
            link: RawUserDot {
              time: row.linked_at,
              user: UserIdRef { id: row.linked_by },
            },
            unlink: (),
            etwin: options.etwin.clone(),
            remote: options.remote.clone(),
          }),
          old: vec![],
        };
        Ok(link)
      }
    }
  }

  async fn touch_twinoid_link(
    &self,
    options: &TouchLinkOptions<TwinoidUserIdRef>,
  ) -> Result<VersionedRawLink<TwinoidUserIdRef>, TouchLinkError<TwinoidUserIdRef>> {
    unimplemented!()
  }

  async fn get_link_from_hammerfest(
    &self,
    options: &GetLinkOptions<HammerfestUserIdRef>,
  ) -> Result<VersionedRawLink<HammerfestUserIdRef>, Box<dyn Error>> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      linked_at: Instant,
      linked_by: UserId,
      user_id: UserId,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
        SELECT linked_at, linked_by, user_id
        FROM hammerfest_user_links
        WHERE hammerfest_server = $1::HAMMERFEST_SERVER
          AND hammerfest_user_id = $2::HAMMERFEST_USER_ID;
    ",
    )
    .bind(&options.remote.server)
    .bind(&options.remote.id)
    .fetch_optional(self.database.as_ref())
    .await?;

    match row {
      None => Ok(VersionedRawLink {
        current: None,
        old: vec![],
      }),
      Some(row) => {
        let link: VersionedRawLink<HammerfestUserIdRef> = VersionedRawLink {
          current: Some(RawLink {
            link: RawUserDot {
              time: row.linked_at,
              user: UserIdRef { id: row.linked_by },
            },
            unlink: (),
            etwin: UserIdRef { id: row.user_id },
            remote: options.remote.clone(),
          }),
          old: vec![],
        };
        Ok(link)
      }
    }
  }
}

#[cfg(test)]
mod test {
  use crate::pg::PgLinkStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::hammerfest::HammerfestStore;
  use etwin_core::link::LinkStore;
  use etwin_db_schema::force_create_latest;
  use etwin_hammerfest_store::pg::PgHammerfestStore;
  use serial_test::serial;
  use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
  use sqlx::PgPool;
  use std::sync::Arc;

  async fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn HammerfestStore>, Arc<dyn LinkStore>> {
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
    force_create_latest(&database).await.unwrap();

    let database = Arc::new(database);

    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let hammerfest_store: Arc<dyn HammerfestStore> =
      Arc::new(PgHammerfestStore::new(Arc::clone(&clock), Arc::clone(&database)));
    let link_store: Arc<dyn LinkStore> = Arc::new(PgLinkStore::new(Arc::clone(&clock), Arc::clone(&database)));

    TestApi {
      _clock: clock,
      hammerfest_store,
      link_store,
    }
  }

  #[tokio::test]
  #[serial]
  async fn test_empty() {
    crate::test::test_empty(make_test_api().await).await;
  }
}
