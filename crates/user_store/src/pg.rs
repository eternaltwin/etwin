use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, Secret};
use etwin_core::email::EmailAddress;
use etwin_core::password::PasswordHash;
use etwin_core::user::{
  CompleteSimpleUser, CreateUserOptions, DeleteUserError, GetShortUserOptions, GetUserOptions, GetUserResult,
  ShortUser, ShortUserWithPassword, UpdateUserError, UpdateUserOptions, UserDisplayName, UserDisplayNameVersion,
  UserDisplayNameVersions, UserFields, UserId, UserIdRef, UserRef, UserStore, Username,
  USER_DISPLAY_NAME_LOCK_DURATION,
};
use etwin_core::uuid::UuidGenerator;
use sqlx::postgres::PgPool;
use sqlx::{Postgres, Transaction};
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

async fn touch_email_address(
  tx: &mut Transaction<'_, Postgres>,
  secret: &Secret,
  email: &EmailAddress,
  now: Instant,
) -> Result<Vec<u8>, Box<dyn Error>> {
  #[derive(Debug, sqlx::FromRow)]
  struct Row {
    hash: Vec<u8>,
  }
  let row = sqlx::query_as::<_, Row>(
    r"
          INSERT
          INTO email_addresses(email_address, _hash, created_at)
          VALUES (
            pgp_sym_encrypt($1::EMAIL_ADDRESS, $2::TEXT), digest($1::EMAIL_ADDRESS, 'sha256'), $3::INSTANT
          )
          ON CONFLICT (_hash) DO NOTHING
          RETURNING _hash as hash;
        ",
  )
  .bind(email)
  .bind(secret.as_str())
  .bind(now)
  .fetch_one(tx)
  .await?;
  Ok(row.hash)
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

    let mut tx = self.database.as_ref().begin().await?;

    let row = {
      let email_hash = match &options.email {
        Some(email) => Some(touch_email_address(&mut tx, &self.database_secret, email, self.clock.now()).await?),
        None => None,
      };

      let r = {
        #[derive(Debug, sqlx::FromRow)]
        struct Row {
          created_at: Instant,
          is_administrator: bool,
        }
        let row = sqlx::query_as::<_, Row>(
          r"
          WITH administrator_exists AS (SELECT 1 FROM users WHERE is_administrator)
          INSERT
          INTO users(user_id, created_at, is_administrator)
          VALUES (
            $1::USER_ID, $2::INSTANT, (NOT EXISTS(SELECT 1 FROM administrator_exists))
          )
          RETURNING created_at, is_administrator;
        ",
        )
        .bind(user_id)
        .bind(now)
        .fetch_one(&mut tx)
        .await?;
        row
      };
      {
        #[derive(Debug, sqlx::FromRow)]
        struct Row {
          user_id: UserId,
        }
        let _row = sqlx::query_as::<_, Row>(
          r"
          INSERT
          INTO users_history(user_id, period, _is_current, updated_by, display_name, username, email, password)
          VALUES (
            $1::USER_ID, PERIOD($2::INSTANT, NULL), TRUE, $1::USER_ID, $3::USER_DISPLAY_NAME, $4::USERNAME, $5::EMAIL_ADDRESS_HASH, $6::PASSWORD_HASH
          )
          RETURNING user_id;
        ",
        )
          .bind(user_id)
          .bind(now)
          .bind(&options.display_name)
          .bind(options.username.as_ref())
          .bind(email_hash)
          .bind(options.password.as_ref())
          .fetch_one(&mut tx)
          .await?;
      }
      r
    };
    tx.commit().await?;

    let user = CompleteSimpleUser {
      id: user_id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: options.display_name.clone(),
        },
      },
      is_administrator: row.is_administrator,
      created_at: row.created_at,
      username: options.username.clone(),
      email_address: None,
    };

    Ok(user)
  }

  async fn get_user(&self, options: &GetUserOptions) -> Result<Option<GetUserResult>, Box<dyn Error>> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      user_id: UserId,
      created_at: Instant,
      is_administrator: bool,
      display_name: UserDisplayName,
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
    if ref_email.is_some() {
      return Ok(None);
    }

    let row = sqlx::query_as::<_, Row>(
      r"
      SELECT user_id, created_at, is_administrator, display_name, username
      FROM users_current
      WHERE user_id = $1::USER_ID OR username = $2::USERNAME;
      ",
    )
    .bind(ref_id)
    .bind(ref_username)
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
      created_at: row.created_at,
      username: row.username,
      email_address: None,
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

  async fn get_user_with_password(
    &self,
    options: &GetUserOptions,
  ) -> Result<Option<ShortUserWithPassword>, Box<dyn Error>> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      user_id: UserId,
      display_name: UserDisplayName,
      password: Option<PasswordHash>,
    }

    let mut ref_id: Option<UserId> = None;
    let mut ref_username: Option<Username> = None;
    let mut ref_email: Option<EmailAddress> = None;
    match &options.r#ref {
      UserRef::Id(r) => ref_id = Some(r.id),
      UserRef::Username(r) => ref_username = Some(r.username.clone()),
      UserRef::Email(r) => ref_email = Some(r.email.clone()),
    }
    if ref_email.is_some() {
      return Ok(None);
    }

    let row = sqlx::query_as::<_, Row>(
      r"
      SELECT user_id, display_name, password
      FROM users_current
      WHERE user_id = $1::USER_ID OR username = $2::USERNAME;
      ",
    )
    .bind(ref_id)
    .bind(ref_username)
    .fetch_optional(self.database.as_ref())
    .await?;

    let row: Row = if let Some(r) = row {
      r
    } else {
      return Ok(None);
    };

    let user = ShortUserWithPassword {
      id: row.user_id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: row.display_name,
        },
      },
      password: row.password,
    };

    Ok(Some(user))
  }

  async fn get_short_user(&self, options: &GetShortUserOptions) -> Result<Option<ShortUser>, Box<dyn Error>> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      user_id: UserId,
      display_name: UserDisplayName,
    }

    let mut ref_id: Option<UserId> = None;
    let mut ref_username: Option<Username> = None;
    let mut ref_email: Option<EmailAddress> = None;
    match &options.r#ref {
      UserRef::Id(r) => ref_id = Some(r.id),
      UserRef::Username(r) => ref_username = Some(r.username.clone()),
      UserRef::Email(r) => ref_email = Some(r.email.clone()),
    }
    if ref_email.is_some() {
      return Ok(None);
    }

    let row = sqlx::query_as::<_, Row>(
      r"
      SELECT user_id, display_name
      FROM users_current
      WHERE user_id = $1::USER_ID OR username = $2::USERNAME;
      ",
    )
    .bind(ref_id)
    .bind(ref_username)
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

  async fn update_user(&self, options: &UpdateUserOptions) -> Result<CompleteSimpleUser, UpdateUserError> {
    let now = self.clock.now();

    let mut tx = self.database.as_ref().begin().await.map_err(UpdateUserError::other)?;

    if options.patch.display_name.is_some() {
      #[derive(Debug, sqlx::FromRow)]
      struct Row {
        start_time: Instant,
        value: UserDisplayName,
      }

      let row = sqlx::query_as::<_, Row>(
        r"
        SELECT lower(period) AS start_time, display_name AS value FROM users_history AS cur
        WHERE
          user_id = $1::USER_ID
          AND NOT EXISTS(
            SELECT 1
            FROM users_history AS next
            WHERE
              next.user_id = $1::USER_ID
              AND next.period >> cur.period
              AND NOT (next.display_name = cur.display_name)
          )
        ORDER BY start_time DESC
        LIMIT 1;
      ",
      )
      .bind(options.r#ref.id)
      .fetch_one(&mut tx)
      .await
      .map_err(UpdateUserError::other)?;

      let lock_period = row.start_time..(row.start_time + *USER_DISPLAY_NAME_LOCK_DURATION);
      if lock_period.contains(&now) {
        return Err(UpdateUserError::LockedDisplayName(
          options.r#ref,
          lock_period.into(),
          now,
        ));
      }
    }

    if options.patch.username.is_some() {
      #[derive(Debug, sqlx::FromRow)]
      struct Row {
        start_time: Instant,
        value: Username,
      }

      let row = sqlx::query_as::<_, Row>(
        r"
        SELECT lower(period) AS start_time, username AS value FROM users_history AS cur
        WHERE
          user_id = $1::USER_ID
          AND NOT EXISTS(
            SELECT 1
            FROM users_history AS next
            WHERE
              next.user_id = $1::USER_ID
              AND next.period >> cur.period
              AND NOT ((next.username IS NULL AND cur.username IS NULL) OR (next.username IS NOT NULL AND cur.username IS NOT NULL AND next.username = cur.username))
          )
        ORDER BY start_time DESC
        LIMIT 1;
      ",
      )
        .bind(options.r#ref.id)
        .fetch_one(&mut tx)
        .await
        .map_err(UpdateUserError::other)?;

      let lock_period = row.start_time..(row.start_time + *USER_DISPLAY_NAME_LOCK_DURATION);
      if lock_period.contains(&now) {
        return Err(UpdateUserError::LockedUsername(options.r#ref, lock_period.into(), now));
      }
    }

    if options.patch.password.is_some() {
      #[derive(Debug, sqlx::FromRow)]
      struct Row {
        start_time: Instant,
        value: PasswordHash,
      }

      let row = sqlx::query_as::<_, Row>(
        r"
        SELECT lower(period) AS start_time, password FROM users_history AS cur
        WHERE
          user_id = $1::USER_ID
          AND NOT EXISTS(
            SELECT 1
            FROM users_history AS next
            WHERE
              next.user_id = $1::USER_ID
              AND next.period >> cur.period
              AND NOT ((next.password IS NULL AND cur.password IS NULL) OR (next.password IS NOT NULL AND cur.password IS NOT NULL AND next.password = cur.password))
          )
        ORDER BY start_time DESC
        LIMIT 1;
      ",
      )
        .bind(options.r#ref.id)
        .fetch_one(&mut tx)
        .await
        .map_err(UpdateUserError::other)?;

      let lock_period = row.start_time..(row.start_time + *USER_DISPLAY_NAME_LOCK_DURATION);
      if lock_period.contains(&now) {
        return Err(UpdateUserError::LockedPassword(options.r#ref, lock_period.into(), now));
      }
    }

    {
      #[derive(Debug, sqlx::FromRow)]
      struct Row {
        user_id: UserId,
      }

      let res = sqlx::query(
        r"
      WITH prev_state AS (
        UPDATE users_history SET period = PERIOD(lower(period), $1::INSTANT), _is_current = NULL
        WHERE user_id = $2::USER_ID AND upper_inf(period)
        RETURNING display_name, username, password
      )
      INSERT INTO users_history(
        user_id, period, _is_current, updated_by,
        display_name,
        username,
        password
      )
      SELECT
        $2::USER_ID, PERIOD($1::INSTANT, NULL), TRUE, $3::USER_ID,
        CASE WHEN $4::BOOLEAN THEN $5::USER_DISPLAY_NAME ELSE prev_state.display_name END,
        CASE WHEN $6::BOOLEAN THEN $7::USERNAME ELSE prev_state.username END,
        CASE WHEN $8::BOOLEAN THEN $9::PASSWORD_HASH ELSE prev_state.password END
      FROM prev_state
      RETURNING user_id;
      ",
      )
      .bind(now)
      .bind(options.r#ref.id)
      .bind(options.actor.id)
      .bind(options.patch.display_name.is_some())
      .bind(options.patch.display_name.as_ref())
      .bind(options.patch.username.is_some())
      .bind(options.patch.username.as_ref())
      .bind(options.patch.password.is_some())
      .bind(options.patch.password.as_ref())
      .execute(&mut tx)
      .await
      .map_err(UpdateUserError::other)?;
      assert!(res.rows_affected() == 1);
    }

    let row = {
      #[derive(Debug, sqlx::FromRow)]
      struct Row {
        user_id: UserId,
        created_at: Instant,
        is_administrator: bool,
        display_name: UserDisplayName,
        username: Option<Username>,
      }

      let row = sqlx::query_as::<_, Row>(
        r"
      SELECT user_id, created_at, is_administrator, display_name, username
      FROM users_current
      WHERE user_id = $1::USER_ID;
      ",
      )
      .bind(options.r#ref.id)
      .fetch_one(&mut tx)
      .await
      .map_err(UpdateUserError::other)?;
      row
    };

    tx.commit().await.map_err(UpdateUserError::other)?;

    let user: CompleteSimpleUser = CompleteSimpleUser {
      id: row.user_id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: row.display_name,
        },
      },
      is_administrator: row.is_administrator,
      created_at: row.created_at,
      username: row.username,
      email_address: None,
    };

    Ok(user)
  }

  async fn hard_delete_user(&self, user_ref: UserIdRef) -> Result<(), DeleteUserError> {
    let res = sqlx::query(
      r"
        DELETE
        FROM users
        WHERE user_id = $1::USER_ID;
    ",
    )
    .bind(user_ref.id)
    .execute(self.database.as_ref())
    .await
    .map_err(DeleteUserError::other)?;

    match res.rows_affected() {
      0 => Err(DeleteUserError::NotFound(user_ref)),
      1 => Ok(()),
      _ => panic!("AssertionError: Expected 0 or 1 rows to be affected"),
    }
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

  test_user_store!(
    #[serial]
    || make_test_api().await
  );
}
