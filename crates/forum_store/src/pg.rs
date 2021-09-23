use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, Listing, LocaleId};
use etwin_core::forum::{
  ForumRoleGrant, ForumSection, ForumSectionDisplayName, ForumSectionId, ForumSectionKey, ForumSectionMeta,
  ForumSectionRef, ForumSectionSelf, ForumStore, ForumThreadListing, GetForumSectionOptions, RawAddModeratorOptions,
  RawGetRoleGrantsOptions, RawGetThreadsOptions, UpsertSystemSectionError, UpsertSystemSectionOptions,
};
use etwin_core::pg_num::PgU32;
use etwin_core::types::AnyError;
use etwin_core::uuid::UuidGenerator;
use sqlx::PgPool;

pub struct PgForumStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  clock: TyClock,
  database: TyDatabase,
  uuid_generator: TyUuidGenerator,
}

impl<TyClock, TyDatabase, TyUuidGenerator> PgForumStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  pub fn new(clock: TyClock, database: TyDatabase, uuid_generator: TyUuidGenerator) -> Self {
    Self {
      clock,
      database,
      uuid_generator,
    }
  }
}

const THREADS_PER_PAGE: u32 = 20;

#[async_trait]
impl<TyClock, TyDatabase, TyUuidGenerator> ForumStore for PgForumStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  async fn add_moderator(&self, options: &RawAddModeratorOptions) -> Result<(), AnyError> {
    let now = self.clock.now();
    let mut section_id: Option<ForumSectionId> = None;
    let mut section_key: Option<&ForumSectionKey> = None;
    match &options.section {
      ForumSectionRef::Id(r) => section_id = Some(r.id),
      ForumSectionRef::Key(r) => section_key = Some(&r.key),
    };

    let res = sqlx::query(
      r"
      WITH section AS (
        SELECT forum_section_id
        FROM forum_sections
        WHERE
          forum_section_id = $1::FORUM_SECTION_ID OR key = $2::FORUM_SECTION_KEY
      )
      INSERT
      INTO forum_role_grants(
        forum_section_id, user_id, start_time, granted_by
      )
        (
          SELECT forum_section_id, $3::USER_ID AS user_id, $5::INSTANT AS start_time, $4::USER_ID AS granted_by
          FROM section
        )
      ON CONFLICT (forum_section_id, user_id) DO NOTHING;",
    )
    .bind(section_id)
    .bind(section_key)
    .bind(options.grantee.id)
    .bind(options.granter.id)
    .bind(now)
    .execute(self.database.as_ref())
    .await?;
    assert!(res.rows_affected() <= 1);
    Ok(())
  }

  async fn get_section_meta(&self, _options: &GetForumSectionOptions) -> Result<ForumSectionMeta, AnyError> {
    todo!()
  }

  async fn get_threads(&self, _options: &RawGetThreadsOptions) -> Result<ForumThreadListing, AnyError> {
    todo!()
  }

  async fn get_role_grants(&self, _options: &RawGetRoleGrantsOptions) -> Result<Vec<ForumRoleGrant>, AnyError> {
    todo!()
  }

  async fn upsert_system_section(
    &self,
    options: &UpsertSystemSectionOptions,
  ) -> Result<ForumSection, UpsertSystemSectionError> {
    let now = self.clock.now();
    let mut tx = self
      .database
      .as_ref()
      .begin()
      .await
      .map_err(|e| UpsertSystemSectionError::Other(Box::new(e)))?;
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      forum_section_id: ForumSectionId,
      key: ForumSectionKey,
      ctime: Instant,
      display_name: ForumSectionDisplayName,
      locale: Option<LocaleId>,
      thread_count: PgU32,
    }
    let old_row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
        WITH section AS (
          SELECT forum_section_id, key, ctime, display_name, locale
          FROM forum_sections
          WHERE key = $1::FORUM_SECTION_KEY
        ),
        thread_count AS (
          SELECT COUNT(*)::U32 AS thread_count
          FROM forum_threads, section
          WHERE forum_threads.forum_section_id = section.forum_section_id
        )
        SELECT forum_section_id, key, ctime, display_name, locale, thread_count
        FROM section, thread_count;
    ",
    )
    .bind(&options.key)
    .fetch_optional(&mut tx)
    .await
    .map_err(|e| UpsertSystemSectionError::Other(Box::new(e)))?;
    let section = match old_row {
      None => {
        let forum_section_id = ForumSectionId::from_uuid(self.uuid_generator.next());
        #[derive(Debug, sqlx::FromRow)]
        struct Row {
          ctime: Instant,
        }
        let row: Row = sqlx::query_as::<_, Row>(
          r"
            INSERT INTO forum_sections(
              forum_section_id, key, ctime,
              display_name, display_name_mtime,
              locale, locale_mtime
            )
            VALUES (
              $1::FORUM_SECTION_ID, $2::FORUM_SECTION_KEY, $3::INSTANT,
              $4::FORUM_SECTION_DISPLAY_NAME, $3::INSTANT,
              $5::LOCALE_ID, $3::INSTANT
            )
            RETURNING ctime;
          ",
        )
        .bind(forum_section_id)
        .bind(&options.key)
        .bind(now)
        .bind(&options.display_name)
        .bind(options.locale)
        .fetch_one(&mut tx)
        .await
        .map_err(|e| UpsertSystemSectionError::Other(Box::new(e)))?;
        ForumSection {
          id: forum_section_id,
          key: Some(options.key.clone()),
          display_name: options.display_name.clone(),
          ctime: row.ctime,
          locale: options.locale,
          threads: Listing {
            offset: 0,
            limit: THREADS_PER_PAGE,
            count: 0,
            items: vec![],
          },
          role_grants: vec![],
          this: ForumSectionSelf { roles: vec![] },
        }
      }
      Some(old_row) => {
        let display_name_patch: Option<&ForumSectionDisplayName> = if old_row.display_name != options.display_name {
          Some(&options.display_name)
        } else {
          None
        };
        let locale_id_patch: Option<Option<LocaleId>> = if old_row.locale != options.locale {
          Some(options.locale)
        } else {
          None
        };
        match (display_name_patch, locale_id_patch) {
          (None, None) => {
            // No-op
          }
          _ => todo!(),
        }
        let threads = get_sections_tx().await;
        let role_grants = get_role_grants_tx().await;
        let this = get_section_self_tx().await;
        ForumSection {
          id: old_row.forum_section_id,
          key: Some(old_row.key),
          display_name: old_row.display_name,
          ctime: old_row.ctime,
          locale: old_row.locale,
          threads,
          role_grants,
          this,
        }
      }
    };
    tx.commit()
      .await
      .map_err(|e| UpsertSystemSectionError::Other(Box::new(e)))?;
    Ok(section)
  }
}

async fn get_sections_tx() -> ForumThreadListing {
  ForumThreadListing {
    offset: 0,
    limit: 20,
    count: 0,
    items: vec![],
  }
}

async fn get_role_grants_tx() -> Vec<ForumRoleGrant> {
  vec![]
}

async fn get_section_self_tx() -> ForumSectionSelf {
  ForumSectionSelf { roles: vec![] }
}
