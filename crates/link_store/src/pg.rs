use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, RawUserDot};
use etwin_core::dinoparc::{DinoparcServer, DinoparcUserId, DinoparcUserIdRef};
use etwin_core::hammerfest::{HammerfestServer, HammerfestUserId, HammerfestUserIdRef};
use etwin_core::link::{
  GetLinkOptions, GetLinksFromEtwinOptions, LinkStore, RawLink, TouchLinkError, TouchLinkOptions, VersionedRawLink,
  VersionedRawLinks,
};
use etwin_core::twinoid::{TwinoidUserId, TwinoidUserIdRef};
use etwin_core::user::{UserId, UserIdRef};
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
    let now = self.clock.now();

    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      linked_at: Instant,
      linked_by: UserId,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
        INSERT INTO dinoparc_user_links(user_id, dinoparc_server, dinoparc_user_id, linked_at, linked_by)
        VALUES ($1::USER_ID, $2::DINOPARC_SERVER, $3::DINOPARC_USER_ID, $4::INSTANT, $5::USER_ID)
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
        let link: VersionedRawLink<DinoparcUserIdRef> = VersionedRawLink {
          current: Some(RawLink {
            link: RawUserDot {
              time: row.linked_at,
              user: UserIdRef { id: row.linked_by },
            },
            unlink: (),
            etwin: options.etwin,
            remote: options.remote.clone(),
          }),
          old: vec![],
        };
        Ok(link)
      }
    }
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
        VALUES ($1::USER_ID, $2::HAMMERFEST_SERVER, $3::HAMMERFEST_USER_ID, $4::INSTANT, $5::USER_ID)
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
            etwin: options.etwin,
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
    let now = self.clock.now();

    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      linked_at: Instant,
      linked_by: UserId,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
        INSERT INTO twinoid_user_links(user_id, twinoid_user_id, linked_at, linked_by)
        VALUES ($1::USER_ID, $2::TWINOID_USER_ID, $3::INSTANT, $4::USER_ID)
        RETURNING linked_at, linked_by;
    ",
    )
    .bind(&options.etwin.id)
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
        let link: VersionedRawLink<TwinoidUserIdRef> = VersionedRawLink {
          current: Some(RawLink {
            link: RawUserDot {
              time: row.linked_at,
              user: UserIdRef { id: row.linked_by },
            },
            unlink: (),
            etwin: options.etwin,
            remote: options.remote.clone(),
          }),
          old: vec![],
        };
        Ok(link)
      }
    }
  }

  async fn get_link_from_dinoparc(
    &self,
    options: &GetLinkOptions<DinoparcUserIdRef>,
  ) -> Result<VersionedRawLink<DinoparcUserIdRef>, Box<dyn Error>> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      linked_at: Instant,
      linked_by: UserId,
      user_id: UserId,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
        SELECT linked_at, linked_by, user_id
        FROM dinoparc_user_links
        WHERE dinoparc_server = $1::DINOPARC_SERVER
          AND dinoparc_user_id = $2::DINOPARC_USER_ID;
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
        let link: VersionedRawLink<DinoparcUserIdRef> = VersionedRawLink {
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

  async fn get_link_from_twinoid(
    &self,
    options: &GetLinkOptions<TwinoidUserIdRef>,
  ) -> Result<VersionedRawLink<TwinoidUserIdRef>, Box<dyn Error>> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      linked_at: Instant,
      linked_by: UserId,
      user_id: UserId,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
        SELECT linked_at, linked_by, user_id
        FROM twinoid_user_links
        WHERE twinoid_user_id = $1::TWINOID_USER_ID;
    ",
    )
    .bind(&options.remote.id)
    .fetch_optional(self.database.as_ref())
    .await?;

    match row {
      None => Ok(VersionedRawLink {
        current: None,
        old: vec![],
      }),
      Some(row) => {
        let link: VersionedRawLink<TwinoidUserIdRef> = VersionedRawLink {
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

  async fn get_links_from_etwin(
    &self,
    options: &GetLinksFromEtwinOptions,
  ) -> Result<VersionedRawLinks, Box<dyn Error>> {
    let mut links = VersionedRawLinks::default();

    {
      #[derive(Debug, sqlx::FromRow)]
      struct Row {
        dinoparc_server: DinoparcServer,
        dinoparc_user_id: DinoparcUserId,
        linked_at: Instant,
        linked_by: UserId,
      }

      let rows = sqlx::query_as::<_, Row>(
        r"
          SELECT dinoparc_server, dinoparc_user_id, linked_at, linked_by
          FROM dinoparc_user_links
          WHERE dinoparc_user_links.user_id = $1::UUID;
    ",
      )
      .bind(&options.etwin.id)
      .fetch_all(self.database.as_ref())
      .await?;

      for row in rows.into_iter() {
        let link: RawLink<DinoparcUserIdRef> = RawLink {
          link: RawUserDot {
            time: row.linked_at,
            user: UserIdRef { id: row.linked_by },
          },
          unlink: (),
          etwin: options.etwin,
          remote: DinoparcUserIdRef {
            server: row.dinoparc_server,
            id: row.dinoparc_user_id,
          },
        };
        match link.remote.server {
          DinoparcServer::DinoparcCom => links.dinoparc_com.current = Some(link),
          DinoparcServer::EnDinoparcCom => links.en_dinoparc_com.current = Some(link),
          DinoparcServer::SpDinoparcCom => links.sp_dinoparc_com.current = Some(link),
        }
      }
    }
    {
      #[derive(Debug, sqlx::FromRow)]
      struct Row {
        hammerfest_server: HammerfestServer,
        hammerfest_user_id: HammerfestUserId,
        linked_at: Instant,
        linked_by: UserId,
      }

      let rows = sqlx::query_as::<_, Row>(
        r"
          SELECT hammerfest_server, hammerfest_user_id, linked_at, linked_by
          FROM hammerfest_user_links
          WHERE hammerfest_user_links.user_id = $1::UUID;
    ",
      )
      .bind(&options.etwin.id)
      .fetch_all(self.database.as_ref())
      .await?;

      for row in rows.into_iter() {
        let link: RawLink<HammerfestUserIdRef> = RawLink {
          link: RawUserDot {
            time: row.linked_at,
            user: UserIdRef { id: row.linked_by },
          },
          unlink: (),
          etwin: options.etwin,
          remote: HammerfestUserIdRef {
            server: row.hammerfest_server,
            id: row.hammerfest_user_id,
          },
        };
        match link.remote.server {
          HammerfestServer::HammerfestEs => links.hammerfest_es.current = Some(link),
          HammerfestServer::HammerfestFr => links.hammerfest_fr.current = Some(link),
          HammerfestServer::HfestNet => links.hfest_net.current = Some(link),
        }
      }
    }
    {
      #[derive(Debug, sqlx::FromRow)]
      struct Row {
        twinoid_user_id: TwinoidUserId,
        linked_at: Instant,
        linked_by: UserId,
      }

      let row = sqlx::query_as::<_, Row>(
        r"
          SELECT twinoid_user_id, linked_at, linked_by
          FROM twinoid_user_links
          WHERE twinoid_user_links.user_id = $1::UUID;
    ",
      )
      .bind(&options.etwin.id)
      .fetch_optional(self.database.as_ref())
      .await?;

      if let Some(row) = row {
        let link: RawLink<TwinoidUserIdRef> = RawLink {
          link: RawUserDot {
            time: row.linked_at,
            user: UserIdRef { id: row.linked_by },
          },
          unlink: (),
          etwin: options.etwin,
          remote: TwinoidUserIdRef {
            id: row.twinoid_user_id,
          },
        };
        links.twinoid.current = Some(link);
      }
    }

    Ok(links)
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyDatabase> neon::prelude::Finalize for PgLinkStore<TyClock, TyDatabase>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
{
}

#[cfg(test)]
mod test {
  use crate::pg::PgLinkStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::core::Secret;
  use etwin_core::dinoparc::DinoparcStore;
  use etwin_core::hammerfest::HammerfestStore;
  use etwin_core::link::LinkStore;
  use etwin_core::user::UserStore;
  use etwin_core::uuid::Uuid4Generator;
  use etwin_db_schema::force_create_latest;
  use etwin_dinoparc_store::pg::PgDinoparcStore;
  use etwin_hammerfest_store::pg::PgHammerfestStore;
  use etwin_user_store::pg::PgUserStore;
  use serial_test::serial;
  use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
  use sqlx::PgPool;
  use std::sync::Arc;

  async fn make_test_api() -> TestApi<
    Arc<VirtualClock>,
    Arc<dyn DinoparcStore>,
    Arc<dyn HammerfestStore>,
    Arc<dyn LinkStore>,
    Arc<dyn UserStore>,
  > {
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
    let dinoparc_store: Arc<dyn DinoparcStore> =
      Arc::new(PgDinoparcStore::new(Arc::clone(&clock), Arc::clone(&database)));
    let hammerfest_store: Arc<dyn HammerfestStore> =
      Arc::new(PgHammerfestStore::new(Arc::clone(&clock), Arc::clone(&database)));
    let link_store: Arc<dyn LinkStore> = Arc::new(PgLinkStore::new(Arc::clone(&clock), Arc::clone(&database)));
    let user_store: Arc<dyn UserStore> = Arc::new(PgUserStore::new(
      Arc::clone(&clock),
      Arc::clone(&database),
      Secret::new("dev_secret".to_string()),
      Uuid4Generator,
    ));

    TestApi {
      clock,
      dinoparc_store,
      hammerfest_store,
      link_store,
      user_store,
    }
  }

  #[tokio::test]
  #[serial]
  async fn test_empty() {
    crate::test::test_empty(make_test_api().await).await;
  }

  #[tokio::test]
  #[serial]
  async fn test_empty_etwin() {
    crate::test::test_empty_etwin(make_test_api().await).await;
  }

  #[tokio::test]
  #[serial]
  async fn test_etwin_linked_to_dinoparc_com() {
    crate::test::test_etwin_linked_to_dinoparc_com(make_test_api().await).await;
  }

  #[tokio::test]
  #[serial]
  async fn test_etwin_linked_to_hammerfest_fr() {
    crate::test::test_etwin_linked_to_hammerfest_fr(make_test_api().await).await;
  }
}
