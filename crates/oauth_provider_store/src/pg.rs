use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::auth::EtwinOauthAccessTokenKey;
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, Secret};
use etwin_core::oauth::{
  CreateStoredAccessTokenOptions, GetOauthAccessTokenOptions, GetOauthClientError, GetOauthClientOptions,
  OauthClientDisplayName, OauthClientId, OauthClientKey, OauthClientRef, OauthProviderStore, SimpleOauthClient,
  SimpleOauthClientWithSecret, StoredOauthAccessToken, UpsertSystemClientOptions,
};
use etwin_core::password::{PasswordHash, PasswordService};
use etwin_core::types::EtwinError;
use etwin_core::user::{UserId, UserIdRef};
use etwin_core::uuid::UuidGenerator;
use sqlx::PgPool;
use url::Url;

pub struct PgOauthProviderStore<TyClock, TyDatabase, TyPassword, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyPassword: PasswordService,
  TyUuidGenerator: UuidGenerator,
{
  clock: TyClock,
  database: TyDatabase,
  password: TyPassword,
  uuid_generator: TyUuidGenerator,
  database_secret: Secret,
}

impl<TyClock, TyDatabase, TyPassword, TyUuidGenerator>
  PgOauthProviderStore<TyClock, TyDatabase, TyPassword, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyPassword: PasswordService,
  TyUuidGenerator: UuidGenerator,
{
  pub fn new(
    clock: TyClock,
    database: TyDatabase,
    password: TyPassword,
    uuid_generator: TyUuidGenerator,
    database_secret: Secret,
  ) -> Self {
    Self {
      clock,
      database,
      password,
      uuid_generator,
      database_secret,
    }
  }
}

#[async_trait]
impl<TyClock, TyDatabase, TyPassword, TyUuidGenerator> OauthProviderStore
  for PgOauthProviderStore<TyClock, TyDatabase, TyPassword, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyPassword: PasswordService,
  TyUuidGenerator: UuidGenerator,
{
  async fn upsert_system_client(&self, options: &UpsertSystemClientOptions) -> Result<SimpleOauthClient, EtwinError> {
    let now = self.clock.now();

    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      oauth_client_id: OauthClientId,
      key: OauthClientKey,
      ctime: Instant,
      display_name: OauthClientDisplayName,
      app_uri: String,
      callback_uri: String,
      secret: PasswordHash,
      owner_id: Option<UserId>,
    }

    let row = sqlx::query_as::<_, Row>(
      r"
      SELECT oauth_client_id, key, ctime,
          display_name, display_name_mtime,
          app_uri, app_uri_mtime,
          callback_uri, callback_uri_mtime,
          pgp_sym_decrypt_bytea(secret, $1::TEXT) AS secret, secret_mtime,
          owner_id
        FROM oauth_clients
        WHERE key = $2::VARCHAR;
      ",
    )
    .bind(self.database_secret.as_str())
    .bind(options.key.as_str())
    .fetch_optional(self.database.as_ref())
    .await?;

    match row {
      None => {
        let oauth_client_id = OauthClientId::from_uuid(self.uuid_generator.next());
        let password_hash = self.password.hash(options.secret.clone());

        #[derive(Debug, sqlx::FromRow)]
        struct Row {
          oauth_client_id: OauthClientId,
          ctime: Instant,
        }

        let row: Row = sqlx::query_as::<_, Row>(
          r"
          INSERT INTO oauth_clients(
            oauth_client_id, key, ctime,
            display_name, display_name_mtime,
            app_uri, app_uri_mtime,
            callback_uri, callback_uri_mtime,
            secret, secret_mtime,
            owner_id
          )
           VALUES (
             $2::OAUTH_CLIENT_ID, $3::VARCHAR, $4::INSTANT,
             $5::VARCHAR, $4::INSTANT,
             $6::VARCHAR, $4::INSTANT,
             $7::VARCHAR, $4::INSTANT,
             pgp_sym_encrypt_bytea($8::BYTEA, $1::TEXT), $4::INSTANT,
             NULL
           )
           RETURNING oauth_client_id, ctime;
      ",
        )
        .bind(self.database_secret.as_str())
        .bind(oauth_client_id)
        .bind(options.key.as_str())
        .bind(now)
        .bind(options.display_name.as_str())
        .bind(options.app_uri.as_str())
        .bind(options.callback_uri.as_str())
        .bind(password_hash)
        .fetch_one(self.database.as_ref())
        .await?;

        Ok(SimpleOauthClient {
          id: row.oauth_client_id,
          key: Some(options.key.clone()),
          display_name: options.display_name.clone(),
          app_uri: options.app_uri.clone(),
          callback_uri: options.callback_uri.clone(),
          owner: None,
        })
      }
      Some(row) => {
        if row.display_name != options.display_name {
          todo!()
        }
        if row.app_uri.as_str() != options.app_uri.as_str() {
          todo!()
        }
        if row.callback_uri.as_str() != options.callback_uri.as_str() {
          todo!()
        }
        if !self.password.verify(row.secret, options.secret.clone()) {
          todo!()
        }

        Ok(SimpleOauthClient {
          id: row.oauth_client_id,
          key: Some(options.key.clone()),
          display_name: options.display_name.clone(),
          app_uri: options.app_uri.clone(),
          callback_uri: options.callback_uri.clone(),
          owner: None,
        })
      }
    }
  }

  async fn get_client(&self, options: &GetOauthClientOptions) -> Result<SimpleOauthClient, GetOauthClientError> {
    let mut ref_id: Option<OauthClientId> = None;
    let mut ref_key: Option<OauthClientKey> = None;
    match &options.r#ref {
      OauthClientRef::Id(r) => ref_id = Some(r.id),
      OauthClientRef::Key(r) => ref_key = Some(r.key.clone()),
    }

    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      oauth_client_id: OauthClientId,
      key: Option<OauthClientKey>,
      ctime: Instant,
      display_name: OauthClientDisplayName,
      app_uri: String,
      callback_uri: String,
      owner_id: Option<UserId>,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
      SELECT oauth_client_id, key, ctime, display_name, app_uri, callback_uri, owner_id
      FROM oauth_clients
      WHERE oauth_client_id = $1::OAUTH_CLIENT_ID OR key = $2::OAUTH_CLIENT_KEY;
      ",
    )
    .bind(ref_id)
    .bind(ref_key)
    .fetch_optional(self.database.as_ref())
    .await
    .map_err(|e| GetOauthClientError::Other(e.into()))?;

    let row: Row = row.ok_or_else(|| GetOauthClientError::NotFound(options.r#ref.clone()))?;

    Ok(SimpleOauthClient {
      id: row.oauth_client_id,
      key: row.key,
      display_name: row.display_name,
      app_uri: Url::parse(row.app_uri.as_str()).map_err(|e| GetOauthClientError::Other(e.into()))?,
      callback_uri: Url::parse(row.callback_uri.as_str()).map_err(|e| GetOauthClientError::Other(e.into()))?,
      owner: row.owner_id.map(UserIdRef::from),
    })
  }

  async fn get_client_with_secret(
    &self,
    options: &GetOauthClientOptions,
  ) -> Result<SimpleOauthClientWithSecret, EtwinError> {
    let mut ref_id: Option<OauthClientId> = None;
    let mut ref_key: Option<OauthClientKey> = None;
    match &options.r#ref {
      OauthClientRef::Id(r) => ref_id = Some(r.id),
      OauthClientRef::Key(r) => ref_key = Some(r.key.clone()),
    }

    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      oauth_client_id: OauthClientId,
      key: Option<OauthClientKey>,
      ctime: Instant,
      display_name: OauthClientDisplayName,
      app_uri: String,
      callback_uri: String,
      owner_id: Option<UserId>,
      secret: Vec<u8>,
    }

    let row = sqlx::query_as::<_, Row>(
      r"
      SELECT oauth_client_id, key, ctime, display_name, app_uri, callback_uri, owner_id, pgp_sym_decrypt_bytea(secret, $1::TEXT) AS secret
      FROM oauth_clients
      WHERE oauth_client_id = $2::OAUTH_CLIENT_ID OR key = $3::OAUTH_CLIENT_KEY;
      ",
    )
      .bind(self.database_secret.as_str())
      .bind(ref_id)
      .bind(ref_key)
      .fetch_optional(self.database.as_ref())
      .await?;

    let row: Row = if let Some(r) = row {
      r
    } else {
      return Err("NotFound".into());
    };

    Ok(SimpleOauthClientWithSecret {
      id: row.oauth_client_id,
      key: row.key,
      display_name: row.display_name,
      app_uri: Url::parse(row.app_uri.as_str())?,
      callback_uri: Url::parse(row.callback_uri.as_str())?,
      owner: row.owner_id.map(UserIdRef::from),
      secret: PasswordHash(row.secret),
    })
  }

  async fn create_access_token(
    &self,
    options: &CreateStoredAccessTokenOptions,
  ) -> Result<StoredOauthAccessToken, EtwinError> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      oauth_access_token_id: EtwinOauthAccessTokenKey,
      oauth_client_id: OauthClientId,
      user_id: UserId,
      ctime: Instant,
      atime: Instant,
    }

    let row = sqlx::query_as::<_, Row>(
      r"
      INSERT INTO oauth_access_tokens(
            oauth_access_token_id, oauth_client_id, user_id, ctime, atime
          )
          VALUES (
            $1::UUID, $2::OAUTH_CLIENT_ID, $3::USER_ID, $4::INSTANT, $4::INSTANT
          )
          RETURNING oauth_access_token_id, oauth_client_id, user_id, ctime, atime;
      ",
    )
    .bind(options.key.into_uuid())
    .bind(options.client.id)
    .bind(options.user.id)
    .bind(options.ctime)
    .fetch_one(self.database.as_ref())
    .await?;

    Ok(StoredOauthAccessToken {
      key: row.oauth_access_token_id,
      created_at: row.ctime,
      accessed_at: row.atime,
      expires_at: row.atime,
      user: row.user_id.into(),
      client: row.oauth_client_id.into(),
    })
  }

  async fn get_access_token(&self, options: &GetOauthAccessTokenOptions) -> Result<StoredOauthAccessToken, EtwinError> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      oauth_access_token_id: EtwinOauthAccessTokenKey,
      oauth_client_id: OauthClientId,
      user_id: UserId,
      ctime: Instant,
      atime: Instant,
    }

    let row: Option<Row> = if options.touch_accessed_at {
      sqlx::query_as::<_, Row>(
        r"
        UPDATE oauth_access_tokens
        SET atime = NOW()
        WHERE oauth_access_token_id = $1::ETWIN_OAUTH_ACCESS_TOKEN_ID
        RETURNING oauth_access_token_id, oauth_client_id, user_id, ctime, atime;
      ",
      )
      .bind(options.key.into_uuid())
      .fetch_optional(self.database.as_ref())
      .await?
    } else {
      sqlx::query_as::<_, Row>(
        r"
        SELECT oauth_access_token_id, oauth_client_id, user_id, ctime, atime
        FROM oauth_access_tokens
        WHERE oauth_access_token_id = $1::OAUTH_ACCESS_TOKEN_ID;
       ",
      )
      .bind(options.key.into_uuid())
      .fetch_optional(self.database.as_ref())
      .await?
    };

    let row: Row = if let Some(r) = row {
      r
    } else {
      return Err("NotFound".into());
    };

    Ok(StoredOauthAccessToken {
      key: row.oauth_access_token_id,
      created_at: row.ctime,
      accessed_at: row.atime,
      expires_at: row.atime,
      user: row.user_id.into(),
      client: row.oauth_client_id.into(),
    })
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyDatabase, TyPassword, TyUuidGenerator> neon::prelude::Finalize
  for PgOauthProviderStore<TyClock, TyDatabase, TyPassword, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyPassword: PasswordService,
  TyUuidGenerator: UuidGenerator,
{
}

#[cfg(test)]
mod test {
  use super::PgOauthProviderStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::core::Secret;
  use etwin_core::oauth::OauthProviderStore;
  use etwin_core::uuid::Uuid4Generator;
  use etwin_db_schema::force_create_latest;
  use etwin_password::scrypt::ScryptPasswordService;
  use serial_test::serial;
  use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
  use sqlx::PgPool;
  use std::sync::Arc;

  async fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn OauthProviderStore>> {
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
    let password = Arc::new(ScryptPasswordService::recommended_for_tests());
    let uuid_generator = Arc::new(Uuid4Generator);
    let oauth_provider_store: Arc<dyn OauthProviderStore> = Arc::new(PgOauthProviderStore::new(
      Arc::clone(&clock),
      Arc::clone(&database),
      password,
      uuid_generator,
      database_secret,
    ));

    TestApi {
      clock,
      oauth_provider_store,
    }
  }

  test_dinoparc_store!(
    #[serial]
    || make_test_api().await
  );
}
