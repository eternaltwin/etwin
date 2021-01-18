use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, Secret};
use etwin_core::email::EmailAddress;
use etwin_core::user::{
  CompleteSimpleUser, CreateUserOptions, GetShortUserOptions, GetUserOptions, GetUserResult, ShortUser,
  UserDisplayName, UserDisplayNameVersion, UserDisplayNameVersions, UserFields, UserId, UserIdRef, UserRef, UserStore,
  Username,
};
use etwin_core::uuid::UuidGenerator;
use sqlx::postgres::PgPool;
use std::error::Error;

pub struct PgUserStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  clock: TyClock,
  database: TyDatabase,
  database_secret: Secret,
  uuid_generator: TyUuidGenerator,
}

impl<TyClock, TyDatabase, TyUuidGenerator> PgUserStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  pub fn new(clock: TyClock, database: TyDatabase, database_secret: Secret, uuid_generator: TyUuidGenerator) -> Self {
    Self {
      clock,
      database,
      database_secret,
      uuid_generator,
    }
  }
}

#[async_trait]
impl<TyClock, TyDatabase, TyUuidGenerator> UserStore for PgUserStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  async fn create_user(&self, options: &CreateUserOptions) -> Result<CompleteSimpleUser, Box<dyn Error>> {
    let user_id = UserId::from_uuid(self.uuid_generator.next());
    let now = self.clock.now();

    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      user_id: UserId,
      ctime: Instant,
      display_name: UserDisplayName,
      is_administrator: bool,
    }

    let row = sqlx::query_as::<_, Row>(
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
        $2::USER_ID, $6::INSTANT, $3::USER_DISPLAY_NAME, $6::INSTANT,
        (CASE WHEN $4::TEXT IS NULL THEN NULL ELSE pgp_sym_encrypt($4::TEXT, $1::TEXT) END), $6::INSTANT,
        $5::VARCHAR, $6::INSTANT,
        NULL, $6::INSTANT,
        (NOT EXISTS(SELECT 1 FROM administrator_exists))
      )
      RETURNING user_id, ctime, display_name, is_administrator;
    ",
    )
    .bind(self.database_secret.as_str())
    .bind(user_id)
    .bind(&options.display_name)
    .bind(None::<&str>)
    .bind(options.username.as_ref())
    .bind(now)
    .fetch_one(self.database.as_ref())
    .await?;

    let user = CompleteSimpleUser {
      id: user_id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: options.display_name.clone(),
        },
      },
      is_administrator: row.is_administrator,
      created_at: row.ctime,
      username: options.username.clone(),
      email_address: None,
    };

    Ok(user)
  }

  async fn get_user(&self, options: &GetUserOptions) -> Result<Option<GetUserResult>, Box<dyn Error>> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      user_id: UserId,
      display_name: UserDisplayName,
      display_name_mtime: Instant,
      is_administrator: bool,
      ctime: Instant,
      email_address: Option<EmailAddress>,
      username: Option<Username>,
    }

    let mut ref_id: Option<UserId> = None;
    let mut ref_username: Option<Username> = None;
    let mut ref_email: Option<EmailAddress> = None;
    match &options.r#ref {
      UserRef::Id(r) => ref_id = Some(r.id),
      UserRef::Username(r) => ref_username = Some(r.username.clone()),
      UserRef::Email(r) => ref_email = Some(r.email.clone()),
    }

    let row = sqlx::query_as::<_, Row>(
      r"
      SELECT user_id, display_name, display_name_mtime, is_administrator, ctime,
        pgp_sym_decrypt(email_address, $1::TEXT) AS email_address, username
      FROM users
      WHERE users.user_id = $2::UUID OR username = $3::VARCHAR OR
      pgp_sym_decrypt(email_address, $1::TEXT) = $4::VARCHAR;
      ",
    )
    .bind(self.database_secret.as_str())
    .bind(ref_id)
    .bind(ref_username)
    .bind(ref_email)
    .fetch_optional(self.database.as_ref())
    .await?;

    let row: Row = if let Some(r) = row {
      r
    } else {
      return Ok(None);
    };

    let user: CompleteSimpleUser = CompleteSimpleUser {
      id: row.user_id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: row.display_name,
        },
      },
      is_administrator: row.is_administrator,
      created_at: row.ctime,
      username: row.username,
      email_address: row.email_address,
    };

    let user = match options.fields {
      UserFields::Complete => GetUserResult::Complete(user),
      UserFields::CompleteIfSelf { self_user_id } => {
        if self_user_id == user.id {
          GetUserResult::Complete(user)
        } else {
          GetUserResult::Default(user.into())
        }
      }
      UserFields::Default => GetUserResult::Default(user.into()),
      UserFields::Short => GetUserResult::Short(user.into()),
    };

    Ok(Some(user))
  }

  async fn get_short_user(&self, options: &GetShortUserOptions) -> Result<Option<ShortUser>, Box<dyn Error>> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      user_id: UserId,
      display_name: UserDisplayName,
      display_name_mtime: Instant,
      is_administrator: bool,
      ctime: Instant,
      email_address: Option<EmailAddress>,
      username: Option<Username>,
    }

    let mut ref_id: Option<UserId> = None;
    let mut ref_username: Option<Username> = None;
    let mut ref_email: Option<EmailAddress> = None;
    match &options.r#ref {
      UserRef::Id(r) => ref_id = Some(r.id),
      UserRef::Username(r) => ref_username = Some(r.username.clone()),
      UserRef::Email(r) => ref_email = Some(r.email.clone()),
    }

    let row = sqlx::query_as::<_, Row>(
      r"
      SELECT user_id, display_name, display_name_mtime, is_administrator, ctime,
        pgp_sym_decrypt(email_address, $1::TEXT) AS email_address, username
      FROM users
      WHERE users.user_id = $2::UUID OR username = $3::VARCHAR OR
      pgp_sym_decrypt(email_address, $1::TEXT) = $4::VARCHAR;
      ",
    )
    .bind(self.database_secret.as_str())
    .bind(ref_id)
    .bind(ref_username)
    .bind(ref_email)
    .fetch_optional(self.database.as_ref())
    .await?;

    let row: Row = if let Some(r) = row {
      r
    } else {
      return Ok(None);
    };

    let user = ShortUser {
      id: row.user_id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: row.display_name,
        },
      },
    };

    Ok(Some(user))
  }

  async fn hard_delete_user_by_id(&self, user_ref: UserIdRef) -> Result<(), Box<dyn Error>> {
    let _ = sqlx::query(
      r"
        DELETE
        FROM users
        WHERE user_id = $1::USER_ID;
    ",
    )
    .bind(user_ref.id)
    .fetch_one(self.database.as_ref())
    .await?;

    Ok(())
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyDatabase, TyUuidGenerator> neon::prelude::Finalize for PgUserStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
}

#[cfg(test)]
mod test {
  use super::PgUserStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::core::Secret;
  use etwin_core::user::UserStore;
  use etwin_core::uuid::Uuid4Generator;
  use etwin_db_schema::force_create_latest;
  use serial_test::serial;
  use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
  use sqlx::PgPool;
  use std::sync::Arc;

  async fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn UserStore>> {
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
    let uuid_generator = Arc::new(Uuid4Generator);
    let database_secret = Secret::new("dev_secret".to_string());
    let user_store: Arc<dyn UserStore> = Arc::new(PgUserStore::new(
      clock.clone(),
      database,
      database_secret,
      uuid_generator,
    ));

    TestApi { clock, user_store }
  }

  #[tokio::test]
  #[serial]
  async fn test_create_admin() {
    crate::test::test_create_admin(make_test_api().await).await;
  }

  #[tokio::test]
  #[serial]
  async fn test_register_the_admin_and_retrieve_short() {
    crate::test::test_register_the_admin_and_retrieve_short(make_test_api().await).await;
  }

  #[tokio::test]
  #[serial]
  async fn test_register_the_admin_and_retrieve_default() {
    crate::test::test_register_the_admin_and_retrieve_default(make_test_api().await).await;
  }

  #[tokio::test]
  #[serial]
  async fn test_register_the_admin_and_retrieve_complete() {
    crate::test::test_register_the_admin_and_retrieve_complete(make_test_api().await).await;
  }
}
