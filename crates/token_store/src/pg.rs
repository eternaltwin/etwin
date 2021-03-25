use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, Secret};
use etwin_core::dinoparc::{DinoparcServer, DinoparcSessionKey, DinoparcUserIdRef, StoredDinoparcSession};
use etwin_core::hammerfest::{HammerfestServer, HammerfestSessionKey, HammerfestUserIdRef, StoredHammerfestSession};
use etwin_core::oauth::{RfcOauthAccessTokenKey, RfcOauthRefreshTokenKey, TwinoidAccessToken, TwinoidRefreshToken};
use etwin_core::token::{TokenStore, TouchOauthTokenOptions, TwinoidOauth};
use etwin_core::twinoid::TwinoidUserIdRef;
use etwin_populate::dinoparc::populate_dinoparc;
use etwin_populate::hammerfest::populate_hammerfest;
use sqlx::PgPool;
use std::error::Error;

pub struct PgTokenStore<TyClock, TyDatabase>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
{
  clock: TyClock,
  database: TyDatabase,
  database_secret: Secret,
}

fn box_sqlx_error(e: sqlx::Error) -> Box<dyn Error + Send> {
  Box::new(e)
}

impl<TyClock, TyDatabase> PgTokenStore<TyClock, TyDatabase>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
{
  pub async fn new(
    clock: TyClock,
    database: TyDatabase,
    database_secret: Secret,
  ) -> Result<Self, Box<dyn Error + Send>> {
    let mut tx = database.as_ref().begin().await.map_err(box_sqlx_error)?;
    populate_dinoparc(&mut tx).await?;
    populate_hammerfest(&mut tx).await?;
    tx.commit().await.map_err(box_sqlx_error)?;
    Ok(Self {
      clock,
      database,
      database_secret,
    })
  }
}

#[async_trait]
impl<TyClock, TyDatabase> TokenStore for PgTokenStore<TyClock, TyDatabase>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
{
  async fn touch_twinoid_oauth(&self, options: &TouchOauthTokenOptions) -> Result<(), Box<dyn Error>> {
    let mut tx = self.database.as_ref().begin().await?;
    let now = self.clock.now();

    {
      {
        // Potentially revoke some access tokens
        let res = sqlx::query(
          r"
          WITH revoked AS (
            DELETE FROM twinoid_access_tokens AS tat
              WHERE (
                (
                  tat._twinoid_access_token_hash = digest($2::RFC_OAUTH_ACCESS_TOKEN_KEY, 'sha256')
                  AND tat.twinoid_user_id <> $3::TWINOID_USER_ID
                ) OR (
                  tat._twinoid_access_token_hash <> digest($2::RFC_OAUTH_ACCESS_TOKEN_KEY, 'sha256')
                  AND tat.twinoid_user_id = $3::TWINOID_USER_ID
                )
              )
            RETURNING twinoid_access_token, _twinoid_access_token_hash, twinoid_user_id, ctime, atime, $1::INSTANT AS dtime, expiration_time
          )
          INSERT INTO old_twinoid_access_tokens(twinoid_access_token, _twinoid_access_token_hash, twinoid_user_id,
                                                ctime, atime, dtime, expiration_time)
          SELECT revoked.*
          FROM revoked;",
        )
          .bind(now)
          .bind(&options.access_token)
          .bind(&options.twinoid_user_id)
          .execute(&mut tx)
          .await?;
        // Affected row counts:
        // +0-1: Access token matched a different previous user
        // +0-1: User matched a different older access token
        assert!((0..=2u64).contains(&res.rows_affected()));
      }
      {
        // Potentially revoke some refresh tokens
        let res = sqlx::query(
          r"
          WITH revoked AS (
            DELETE FROM twinoid_refresh_tokens AS trt
              WHERE (
                (
                  trt._twinoid_refresh_token_hash = digest($2::RFC_OAUTH_REFRESH_TOKEN_KEY, 'sha256')
                  AND trt.twinoid_user_id <> $3::TWINOID_USER_ID
                ) OR (
                  trt._twinoid_refresh_token_hash <> digest($2::RFC_OAUTH_REFRESH_TOKEN_KEY, 'sha256')
                  AND trt.twinoid_user_id = $3::TWINOID_USER_ID
                )
              )
            RETURNING twinoid_refresh_token, _twinoid_refresh_token_hash, twinoid_user_id, ctime, atime
          )
          INSERT INTO old_twinoid_refresh_tokens(twinoid_refresh_token, _twinoid_refresh_token_hash, twinoid_user_id,
                                                ctime, atime, dtime)
          SELECT revoked.*, $1::INSTANT AS dtime
          FROM revoked;",
        )
        .bind(now)
        .bind(&options.refresh_token)
        .bind(&options.twinoid_user_id)
        .execute(&mut tx)
        .await?;
        // Affected row counts:
        // +0-1: Refresh token matched a different previous user
        // +0-1: User matched a different older refresh token
        assert!((0..=2u64).contains(&res.rows_affected()));
      }
      {
        // Upsert the access token
        let res = sqlx::query(
          r"
          INSERT INTO twinoid_access_tokens(twinoid_access_token, _twinoid_access_token_hash, twinoid_user_id, ctime, atime, expiration_time)
          VALUES (pgp_sym_encrypt($3::TEXT, $2::TEXT), digest($3::TEXT, 'sha256'), $4::TWINOID_USER_ID, $1::INSTANT, $1::INSTANT, $5::INSTANT)
          ON CONFLICT (_twinoid_access_token_hash)
            DO UPDATE SET atime = $1::INSTANT;",
        )
          .bind(now)
        .bind(&self.database_secret.as_str())
        .bind(&options.access_token)
        .bind(&options.twinoid_user_id)
        .bind(&options.expiration_time)
        .execute(&mut tx)
        .await?;
        // Affected row counts:
        // 1: On first insert
        // 1: On update
        assert_eq!(res.rows_affected(), 1);
      }
      {
        // Upsert the refresh token
        let res = sqlx::query(
          r"
          INSERT INTO twinoid_refresh_tokens(twinoid_refresh_token, _twinoid_refresh_token_hash, twinoid_user_id, ctime, atime)
          VALUES (pgp_sym_encrypt($3::TEXT, $2::TEXT), digest($3::TEXT, 'sha256'), $4::TWINOID_USER_ID, $1::INSTANT, $1::INSTANT)
          ON CONFLICT (_twinoid_refresh_token_hash)
            DO UPDATE SET atime = $1::INSTANT;",
        )
          .bind(now)
        .bind(&self.database_secret.as_str())
        .bind(&options.refresh_token)
        .bind(&options.twinoid_user_id)
        .bind(&options.expiration_time)
          .execute(&mut tx)
        .await?;
        // Affected row counts:
        // 1: On first insert
        // 1: On update
        assert_eq!(res.rows_affected(), 1);
      }
    }

    tx.commit().await?;

    Ok(())
  }

  async fn revoke_twinoid_access_token(&self, access_token: &RfcOauthAccessTokenKey) -> Result<(), Box<dyn Error>> {
    let now = self.clock.now();
    let res = sqlx::query(
      r"
        WITH revoked AS (
          DELETE FROM twinoid_access_tokens
            WHERE _twinoid_access_token_hash = digest($2::TEXT, 'sha256')
            RETURNING twinoid_access_token, _twinoid_access_token_hash, twinoid_user_id, ctime, atime, expiration_time
        )
        INSERT
        INTO old_twinoid_access_tokens(twinoid_access_token, _twinoid_access_token_hash, twinoid_user_id, ctime, atime, expiration_time, dtime)
        SELECT revoked.*, $1::INSTANT AS dtime
        FROM revoked;",
      )
        .bind(now)
        .bind(&access_token)
        .execute(self.database.as_ref())
        .await?;
    // Affected row counts:
    // 0: The revoked token does not exist (or is already revoked)
    // 1: The token was revoked
    assert!((0..=1u64).contains(&res.rows_affected()));
    Ok(())
  }

  async fn revoke_twinoid_refresh_token(&self, refresh_token: &RfcOauthRefreshTokenKey) -> Result<(), Box<dyn Error>> {
    let now = self.clock.now();
    let res = sqlx::query(
      r"
        WITH revoked AS (
          DELETE FROM twinoid_refresh_tokens
            WHERE _twinoid_refresh_token_hash = digest($2::TEXT, 'sha256')
            RETURNING twinoid_refresh_token, _twinoid_refresh_token_hash, twinoid_user_id, ctime, atime
        )
        INSERT
        INTO old_twinoid_refresh_tokens(twinoid_refresh_token, _twinoid_refresh_token_hash, twinoid_user_id, ctime, atime, dtime)
        SELECT revoked.*, $1::INSTANT AS dtime
        FROM revoked;",
    )
      .bind(now)
      .bind(&refresh_token)
      .execute(self.database.as_ref())
      .await?;
    // Affected row counts:
    // 0: The revoked token does not exist (or is already revoked)
    // 1: The token was revoked
    assert!((0..=1u64).contains(&res.rows_affected()));
    Ok(())
  }

  async fn get_twinoid_oauth(&self, options: TwinoidUserIdRef) -> Result<Option<TwinoidOauth>, Box<dyn Error>> {
    let mut tx = self.database.as_ref().begin().await?;
    let now = self.clock.now();

    let result = {
      let refresh_token = {
        #[derive(Debug, sqlx::FromRow)]
        struct Row {
          twinoid_refresh_token: RfcOauthRefreshTokenKey,
          ctime: Instant,
          atime: Instant,
        }

        let row: Option<Row> = sqlx::query_as::<_, Row>(
          r"
          SELECT pgp_sym_decrypt(twinoid_refresh_token, $1::TEXT) AS twinoid_refresh_token, ctime, atime
          FROM twinoid_refresh_tokens
          WHERE twinoid_user_id = $2::TWINOID_USER_ID;
        ",
        )
        .bind(self.database_secret.as_str())
        .bind(options.id)
        .fetch_optional(&mut tx)
        .await?;
        if let Some(row) = row {
          TwinoidRefreshToken {
            key: row.twinoid_refresh_token,
            created_at: row.ctime,
            accessed_at: row.atime,
            twinoid_user_id: options.id,
          }
        } else {
          tx.commit().await?;
          return Ok(None);
        }
      };
      let access_token = {
        #[derive(Debug, sqlx::FromRow)]
        struct Row {
          twinoid_access_token: RfcOauthAccessTokenKey,
          ctime: Instant,
          atime: Instant,
          expiration_time: Instant,
        }

        let row: Option<Row> = sqlx::query_as::<_, Row>(
          r"
          SELECT pgp_sym_decrypt(twinoid_access_token, $2::TEXT) AS twinoid_access_token, ctime, atime, expiration_time
          FROM twinoid_access_tokens
          WHERE twinoid_user_id = $3::TWINOID_USER_ID AND $1::INSTANT < expiration_time;
        ",
        )
        .bind(now)
        .bind(self.database_secret.as_str())
        .bind(options.id)
        .fetch_optional(&mut tx)
        .await?;

        row.map(|row| TwinoidAccessToken {
          key: row.twinoid_access_token,
          created_at: row.ctime,
          accessed_at: row.atime,
          expires_at: row.expiration_time,
          twinoid_user_id: options.id,
        })
      };

      Some(TwinoidOauth {
        refresh_token,
        access_token,
      })
    };

    tx.commit().await?;

    Ok(result)
  }

  async fn touch_dinoparc(
    &self,
    user: DinoparcUserIdRef,
    key: &DinoparcSessionKey,
  ) -> Result<StoredDinoparcSession, Box<dyn Error>> {
    let mut tx = self.database.as_ref().begin().await?;
    let now = self.clock.now();

    {
      let res = sqlx::query(
        r"
          WITH revoked AS (
          DELETE FROM dinoparc_sessions AS hs
          WHERE hs.dinoparc_server = $2::DINOPARC_SERVER
            AND (
              (
              hs._dinoparc_session_key_hash = digest($3::DINOPARC_SESSION_KEY, 'sha256')
                AND hs.dinoparc_user_id <> $4::DINOPARC_USER_ID
              )
              OR (
              hs._dinoparc_session_key_hash <> digest($3::DINOPARC_SESSION_KEY, 'sha256')
                AND hs.dinoparc_user_id = $4::DINOPARC_USER_ID
              )
            )
          RETURNING dinoparc_server, dinoparc_session_key,_dinoparc_session_key_hash, dinoparc_user_id, ctime, atime
        )
        INSERT INTO old_dinoparc_sessions(dinoparc_server, dinoparc_session_key, _dinoparc_session_key_hash, dinoparc_user_id, ctime, atime, dtime)
        SELECT revoked.*, $1::INSTANT AS dtime
        FROM revoked;",
      )
        .bind(now)
        .bind(user.server)
        .bind(key)
        .bind(user.id)
        .execute(&mut tx)
        .await?;
      // Affected row counts:
      // +0-1: Session matched a different previous user
      // +0-1: User matched a different older session
      assert!((0..=2u64).contains(&res.rows_affected()));
    }

    let session = {
      #[derive(Debug, sqlx::FromRow)]
      struct Row {
        ctime: Instant,
      }

      let row: Row = sqlx::query_as::<_, Row>(
        r"
        INSERT INTO dinoparc_sessions(dinoparc_server, dinoparc_session_key, _dinoparc_session_key_hash, dinoparc_user_id, ctime, atime)
        VALUES ($3::DINOPARC_SERVER, pgp_sym_encrypt($4::DINOPARC_SESSION_KEY, $2::TEXT), digest($4::DINOPARC_SESSION_KEY, 'sha256'), $5::DINOPARC_USER_ID, $1::INSTANT, $1::INSTANT)
        ON CONFLICT (dinoparc_server, _dinoparc_session_key_hash)
          DO UPDATE SET atime = $1::INSTANT
        RETURNING ctime;",
      )
        .bind(now)
        .bind(self.database_secret.as_str())
        .bind(user.server)
        .bind(key)
        .bind(user.id)
        .fetch_one(&mut tx)
        .await?;

      StoredDinoparcSession {
        key: key.clone(),
        user,
        ctime: row.ctime,
        atime: now,
      }
    };

    tx.commit().await?;

    Ok(session)
  }

  async fn revoke_dinoparc(&self, server: DinoparcServer, key: &DinoparcSessionKey) -> Result<(), Box<dyn Error>> {
    let now = self.clock.now();
    let res = sqlx::query(
      r"
        WITH revoked AS (
          DELETE FROM dinoparc_sessions
            WHERE dinoparc_server = $2::DINOPARC_SERVER AND _dinoparc_session_key_hash = digest($3::DINOPARC_SESSION_KEY, 'sha256')
            RETURNING dinoparc_server, dinoparc_session_key,_dinoparc_session_key_hash, dinoparc_user_id, ctime, atime
        )
        INSERT INTO old_dinoparc_sessions(dinoparc_server, dinoparc_session_key, _dinoparc_session_key_hash, dinoparc_user_id, ctime, atime, dtime)
        SELECT revoked.*, $1::INSTANT AS dtime
        FROM revoked;",
    )
      .bind(now)
      .bind(server)
      .bind(key)
      .execute(self.database.as_ref())
      .await?;
    // Affected row counts:
    // 0: The revoked session key does not exist (or is already revoked)
    // 1: The session key was revoked
    assert!((0..=1u64).contains(&res.rows_affected()));
    Ok(())
  }

  async fn get_dinoparc(&self, user: DinoparcUserIdRef) -> Result<Option<StoredDinoparcSession>, Box<dyn Error>> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      dinoparc_session_key: DinoparcSessionKey,
      ctime: Instant,
      atime: Instant,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
          SELECT pgp_sym_decrypt(dinoparc_session_key, $1::TEXT) AS dinoparc_session_key, ctime, atime
          FROM dinoparc_sessions
          WHERE dinoparc_server = $2::DINOPARC_SERVER AND dinoparc_user_id = $3::DINOPARC_USER_ID;
        ",
    )
    .bind(self.database_secret.as_str())
    .bind(user.server)
    .bind(user.id)
    .fetch_optional(self.database.as_ref())
    .await?;

    let result = row.map(|r| StoredDinoparcSession {
      ctime: r.ctime,
      atime: r.atime,
      key: r.dinoparc_session_key,
      user,
    });

    Ok(result)
  }

  async fn touch_hammerfest(
    &self,
    user: HammerfestUserIdRef,
    key: &HammerfestSessionKey,
  ) -> Result<StoredHammerfestSession, Box<dyn Error>> {
    let mut tx = self.database.as_ref().begin().await?;
    let now = self.clock.now();

    {
      let res = sqlx::query(
        r"
          WITH revoked AS (
          DELETE FROM hammerfest_sessions AS hs
          WHERE hs.hammerfest_server = $2::HAMMERFEST_SERVER
            AND (
              (
              hs._hammerfest_session_key_hash = digest($3::HAMMERFEST_SESSION_KEY, 'sha256')
                AND hs.hammerfest_user_id <> $4::HAMMERFEST_USER_ID
              )
              OR (
              hs._hammerfest_session_key_hash <> digest($3::HAMMERFEST_SESSION_KEY, 'sha256')
                AND hs.hammerfest_user_id = $4::HAMMERFEST_USER_ID
              )
            )
          RETURNING hammerfest_server, hammerfest_session_key,_hammerfest_session_key_hash, hammerfest_user_id, ctime, atime
        )
        INSERT INTO old_hammerfest_sessions(hammerfest_server, hammerfest_session_key, _hammerfest_session_key_hash, hammerfest_user_id, ctime, atime, dtime)
        SELECT revoked.*, $1::INSTANT AS dtime
        FROM revoked;",
      )
        .bind(now)
        .bind(user.server)
        .bind(key)
        .bind(user.id)
        .execute(&mut tx)
        .await?;
      // Affected row counts:
      // +0-1: Session matched a different previous user
      // +0-1: User matched a different older session
      assert!((0..=2u64).contains(&res.rows_affected()));
    }

    let session = {
      #[derive(Debug, sqlx::FromRow)]
      struct Row {
        ctime: Instant,
      }

      let row: Row = sqlx::query_as::<_, Row>(
        r"
        INSERT INTO hammerfest_sessions(hammerfest_server, hammerfest_session_key, _hammerfest_session_key_hash, hammerfest_user_id, ctime, atime)
        VALUES ($3::HAMMERFEST_SERVER, pgp_sym_encrypt($4::HAMMERFEST_SESSION_KEY, $2::TEXT), digest($4::HAMMERFEST_SESSION_KEY, 'sha256'), $5::HAMMERFEST_USER_ID, $1::INSTANT, $1::INSTANT)
        ON CONFLICT (hammerfest_server, _hammerfest_session_key_hash)
          DO UPDATE SET atime = $1::INSTANT
        RETURNING ctime;",
      )
      .bind(now)
      .bind(self.database_secret.as_str())
      .bind(user.server)
      .bind(key)
      .bind(user.id)
      .fetch_one(&mut tx)
      .await?;

      StoredHammerfestSession {
        key: key.clone(),
        user,
        ctime: row.ctime,
        atime: now,
      }
    };

    tx.commit().await?;

    Ok(session)
  }

  async fn revoke_hammerfest(
    &self,
    server: HammerfestServer,
    key: &HammerfestSessionKey,
  ) -> Result<(), Box<dyn Error>> {
    let now = self.clock.now();
    let res = sqlx::query(
      r"
        WITH revoked AS (
          DELETE FROM hammerfest_sessions
            WHERE hammerfest_server = $2::HAMMERFEST_SERVER AND _hammerfest_session_key_hash = digest($3::HAMMERFEST_SESSION_KEY, 'sha256')
            RETURNING hammerfest_server, hammerfest_session_key,_hammerfest_session_key_hash, hammerfest_user_id, ctime, atime
        )
        INSERT INTO old_hammerfest_sessions(hammerfest_server, hammerfest_session_key, _hammerfest_session_key_hash, hammerfest_user_id, ctime, atime, dtime)
        SELECT revoked.*, $1::INSTANT AS dtime
        FROM revoked;",
    )
      .bind(now)
      .bind(server)
      .bind(key)
      .execute(self.database.as_ref())
      .await?;
    // Affected row counts:
    // 0: The revoked session key does not exist (or is already revoked)
    // 1: The session key was revoked
    assert!((0..=1u64).contains(&res.rows_affected()));
    Ok(())
  }

  async fn get_hammerfest(&self, user: HammerfestUserIdRef) -> Result<Option<StoredHammerfestSession>, Box<dyn Error>> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      hammerfest_session_key: HammerfestSessionKey,
      ctime: Instant,
      atime: Instant,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
          SELECT pgp_sym_decrypt(hammerfest_session_key, $1::TEXT) AS hammerfest_session_key, ctime, atime
          FROM hammerfest_sessions
          WHERE hammerfest_server = $2::HAMMERFEST_SERVER AND hammerfest_user_id = $3::HAMMERFEST_USER_ID;
        ",
    )
    .bind(self.database_secret.as_str())
    .bind(user.server)
    .bind(user.id)
    .fetch_optional(self.database.as_ref())
    .await?;

    let result = row.map(|r| StoredHammerfestSession {
      ctime: r.ctime,
      atime: r.atime,
      key: r.hammerfest_session_key,
      user,
    });

    Ok(result)
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyDatabase> neon::prelude::Finalize for PgTokenStore<TyClock, TyDatabase>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
{
}

#[cfg(test)]
mod test {
  use super::PgTokenStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::core::Secret;
  use etwin_core::dinoparc::DinoparcStore;
  use etwin_core::hammerfest::HammerfestStore;
  use etwin_core::token::TokenStore;
  use etwin_core::twinoid::TwinoidStore;
  use etwin_core::uuid::Uuid4Generator;
  use etwin_db_schema::force_create_latest;
  use etwin_dinoparc_store::pg::PgDinoparcStore;
  use etwin_hammerfest_store::pg::PgHammerfestStore;
  use etwin_twinoid_store::pg::PgTwinoidStore;
  use serial_test::serial;
  use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
  use sqlx::PgPool;
  use std::sync::Arc;

  async fn make_test_api() -> TestApi<
    Arc<VirtualClock>,
    Arc<dyn DinoparcStore>,
    Arc<dyn HammerfestStore>,
    Arc<dyn TokenStore>,
    Arc<dyn TwinoidStore>,
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
    force_create_latest(&database, true).await.unwrap();

    let database = Arc::new(database);

    let clock = Arc::new(VirtualClock::new(Utc.ymd(2020, 1, 1).and_hms(0, 0, 0)));
    let uuid_generator = Arc::new(Uuid4Generator);
    let database_secret = Secret::new("dev_secret".to_string());
    let dinoparc_store: Arc<dyn DinoparcStore> = Arc::new(
      PgDinoparcStore::new(Arc::clone(&clock), Arc::clone(&database))
        .await
        .unwrap(),
    );
    let hammerfest_store: Arc<dyn HammerfestStore> = Arc::new(
      PgHammerfestStore::new(
        Arc::clone(&clock),
        Arc::clone(&database),
        database_secret.clone(),
        Arc::clone(&uuid_generator),
      )
      .await
      .unwrap(),
    );
    let twinoid_store: Arc<dyn TwinoidStore> = Arc::new(PgTwinoidStore::new(Arc::clone(&clock), Arc::clone(&database)));
    let token_store: Arc<dyn TokenStore> = Arc::new(
      PgTokenStore::new(Arc::clone(&clock), Arc::clone(&database), database_secret)
        .await
        .unwrap(),
    );

    TestApi {
      clock,
      dinoparc_store,
      hammerfest_store,
      token_store,
      twinoid_store,
    }
  }

  test_token_store!(
    #[serial]
    || make_test_api().await
  );
}
