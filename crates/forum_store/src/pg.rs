use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, Listing, ListingCount, LocaleId};
use etwin_core::forum::{
  ForumRole, ForumRoleGrant, ForumSection, ForumSectionDisplayName, ForumSectionId, ForumSectionKey, ForumSectionRef,
  ForumSectionSelf, ForumStore, ForumThreadListing, GetForumSectionOptions, GetSectionMetaError,
  RawAddModeratorOptions, RawForumRoleGrant, RawForumSectionMeta, RawGetRoleGrantsOptions, RawGetSectionsOptions,
  RawGetThreadsOptions, UpsertSystemSectionError, UpsertSystemSectionOptions,
};
use etwin_core::pg_num::PgU32;
use etwin_core::types::AnyError;
use etwin_core::uuid::UuidGenerator;
use etwin_db_schema::schema::ForumRoleGrantBySectionArray;
use sqlx::PgPool;
use std::convert::TryInto;

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

    // language=PostgreSQL
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

  async fn get_sections(&self, options: &RawGetSectionsOptions) -> Result<Listing<RawForumSectionMeta>, AnyError> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      forum_section_id: ForumSectionId,
      key: Option<ForumSectionKey>,
      ctime: Instant,
      display_name: ForumSectionDisplayName,
      locale: Option<LocaleId>,
      thread_count: PgU32,
      role_grants: ForumRoleGrantBySectionArray,
    }
    // language=PostgreSQL
    let rows: Vec<Row> = sqlx::query_as::<_, Row>(
      r"
        SELECT
          forum_section_id, key, ctime, display_name, locale,
          thread_count,
          role_grants
        FROM forum_section_meta
        LIMIT $1::U32 OFFSET $2::U32
        ;
    ",
    )
    .bind(PgU32::from(options.limit))
    .bind(PgU32::from(options.offset))
    .fetch_all(self.database.as_ref())
    .await?;
    let items: Vec<_> = rows
      .into_iter()
      .map(|row| RawForumSectionMeta {
        id: row.forum_section_id,
        key: row.key,
        display_name: row.display_name,
        ctime: row.ctime,
        locale: row.locale,
        threads: ListingCount {
          count: row.thread_count.into(),
        },
        role_grants: row
          .role_grants
          .into_inner()
          .into_iter()
          .map(|grant| RawForumRoleGrant {
            role: ForumRole::Moderator,
            user: grant.user_id.into(),
            start_time: grant.start_time,
            granted_by: grant.granted_by.into(),
          })
          .collect(),
      })
      .collect();
    Ok(Listing {
      offset: options.offset,
      limit: options.limit,
      count: items.len().try_into().unwrap(), // TODO: Get count from the DB
      items,
    })
  }

  async fn get_section_meta(
    &self,
    options: &GetForumSectionOptions,
  ) -> Result<RawForumSectionMeta, GetSectionMetaError> {
    let mut section_id: Option<ForumSectionId> = None;
    let mut section_key: Option<&ForumSectionKey> = None;
    match &options.section {
      ForumSectionRef::Id(r) => section_id = Some(r.id),
      ForumSectionRef::Key(r) => section_key = Some(&r.key),
    };
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      forum_section_id: ForumSectionId,
      key: Option<ForumSectionKey>,
      ctime: Instant,
      display_name: ForumSectionDisplayName,
      locale: Option<LocaleId>,
      thread_count: PgU32,
      role_grants: ForumRoleGrantBySectionArray,
    }
    // language=PostgreSQL
    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
        SELECT
          forum_section_id, key, ctime, display_name, locale,
          thread_count,
          role_grants
        FROM forum_section_meta
        WHERE forum_section_id = $1::FORUM_SECTION_ID OR key = $2::FORUM_SECTION_KEY
        ;
    ",
    )
    .bind(section_id)
    .bind(section_key)
    .fetch_optional(self.database.as_ref())
    .await
    .map_err(|e| GetSectionMetaError::Other(Box::new(e)))?;
    let row = row.ok_or(GetSectionMetaError::NotFound)?;
    Ok(RawForumSectionMeta {
      id: row.forum_section_id,
      key: row.key,
      display_name: row.display_name,
      ctime: row.ctime,
      locale: row.locale,
      threads: ListingCount {
        count: row.thread_count.into(),
      },
      role_grants: row
        .role_grants
        .into_inner()
        .into_iter()
        .map(|rg| RawForumRoleGrant {
          role: ForumRole::Moderator,
          user: rg.user_id.into(),
          start_time: rg.start_time,
          granted_by: rg.granted_by.into(),
        })
        .collect(),
    })
  }

  async fn get_threads(&self, _options: &RawGetThreadsOptions) -> Result<ForumThreadListing, AnyError> {
    Ok(Listing {
      offset: 0,
      limit: 0,
      count: 0,
      items: vec![],
    })
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
