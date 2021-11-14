use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::clock::Clock;
use etwin_core::core::{HtmlFragment, Instant, Listing, ListingCount, LocaleId};
use etwin_core::forum::{
  ForumActor, ForumPostId, ForumPostRevisionComment, ForumPostRevisionContent, ForumPostRevisionId, ForumRole,
  ForumRoleGrant, ForumSection, ForumSectionDisplayName, ForumSectionId, ForumSectionKey, ForumSectionRef,
  ForumSectionSelf, ForumStore, ForumThreadId, ForumThreadKey, ForumThreadListing, ForumThreadMeta, ForumThreadRef,
  ForumThreadTitle, GetForumSectionMetaOptions, GetSectionMetaError, GetThreadMetaError, MarktwinText,
  RawAddModeratorOptions, RawCreateForumPostResult, RawCreateForumThreadResult, RawCreatePostOptions,
  RawCreateThreadsOptions, RawForumActor, RawForumPostRevision, RawForumRoleGrant, RawForumSectionMeta,
  RawForumThreadMeta, RawGetForumThreadMetaOptions, RawGetPostsOptions, RawGetRoleGrantsOptions, RawGetSectionsOptions,
  RawGetThreadsOptions, RawLatestForumPostRevisionListing, RawShortForumPost, RawUserForumActor,
  UpsertSystemSectionError, UpsertSystemSectionOptions,
};
use etwin_core::pg_num::PgU32;
use etwin_core::types::AnyError;
use etwin_core::user::UserId;
use etwin_core::uuid::UuidGenerator;
use etwin_db_schema::schema::ForumRoleGrantBySectionArray;
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
    let (section_id, section_key) = options.section.split_deref();

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
      count: PgU32,
      items: Vec<(
        ForumSectionId,
        Option<ForumSectionKey>,
        Instant,
        ForumSectionDisplayName,
        Option<LocaleId>,
        PgU32,
        ForumRoleGrantBySectionArray,
      )>,
    }
    // language=PostgreSQL
    let row: Row = sqlx::query_as::<_, Row>(
      r"
        WITH
          sections AS (
            SELECT forum_section_id, key, ctime, display_name, locale, thread_count, role_grants
            FROM forum_section_meta
            ORDER BY ctime, key, forum_section_id
            LIMIT $1::U32 OFFSET $2::U32
          ),
          section_array AS (
            SELECT COALESCE(ARRAY_AGG(sections.*), '{}') AS items
            FROM sections
          ),
          section_count AS (
            SELECT COUNT(*) AS count
            FROM forum_section_meta
          )
        SELECT count, items
        FROM section_count, section_array
        ;
    ",
    )
    .bind(PgU32::from(options.limit))
    .bind(PgU32::from(options.offset))
    .fetch_one(self.database.as_ref())
    .await?;

    let items: Vec<_> = row
      .items
      .into_iter()
      .map(
        |(id, key, ctime, display_name, locale, thread_count, role_grants)| RawForumSectionMeta {
          id,
          key,
          display_name,
          ctime,
          locale,
          threads: ListingCount {
            count: thread_count.into(),
          },
          role_grants: role_grants
            .into_inner()
            .into_iter()
            .map(|grant| RawForumRoleGrant {
              role: ForumRole::Moderator,
              user: grant.user_id.into(),
              start_time: grant.start_time,
              granted_by: grant.granted_by.into(),
            })
            .collect(),
        },
      )
      .collect();

    Ok(Listing {
      offset: options.offset,
      limit: options.limit,
      count: row.count.into(),
      items,
    })
  }

  async fn get_section_meta(
    &self,
    options: &GetForumSectionMetaOptions,
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

  async fn get_threads(&self, options: &RawGetThreadsOptions) -> Result<ForumThreadListing, AnyError> {
    let (section_id, section_key) = options.section.split_deref();

    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      count: PgU32,
      forum_thread_id: ForumThreadId,
      key: Option<ForumThreadKey>,
      ctime: Instant,
      title: ForumThreadTitle,
      is_pinned: bool,
      is_locked: bool,
      post_count: PgU32,
      forum_section_id: ForumSectionId,
    }
    // TODO: Differentiate `notFound` from "empty"?
    // language=PostgreSQL
    let rows: Vec<Row> = sqlx::query_as::<_, Row>(
      r"
        WITH
          section AS (
            SELECT forum_section_id
            FROM forum_sections
            WHERE
              forum_section_id = $1::FORUM_SECTION_ID OR key = $2::FORUM_SECTION_KEY
          ),
          items AS (
            SELECT forum_thread_id, key, ctime, title, is_pinned, is_locked, post_count
            FROM forum_thread_meta
            WHERE forum_section_id = (SELECT forum_section_id FROM section)
          ),
          item_count AS (
            SELECT COUNT(*) AS count
            FROM items
          )
        SELECT count, items.*
        FROM item_count, items
        LIMIT $3::U32 OFFSET $4::U32
        ;
    ",
    )
    .bind(section_id)
    .bind(section_key)
    .bind(PgU32::from(options.limit))
    .bind(PgU32::from(options.offset))
    .fetch_all(self.database.as_ref())
    .await?;

    let mut count: u32 = 0;

    let items: Vec<_> = rows
      .into_iter()
      .map(|row| {
        count = row.count.into();
        ForumThreadMeta {
          id: row.forum_thread_id,
          key: row.key,
          title: row.title,
          ctime: row.ctime,
          is_locked: row.is_locked,
          is_pinned: row.is_pinned,
          posts: ListingCount {
            count: row.post_count.into(),
          },
        }
      })
      .collect();

    Ok(ForumThreadListing {
      offset: options.offset,
      limit: options.limit,
      count,
      items,
    })
  }

  async fn get_thread_meta(
    &self,
    options: &RawGetForumThreadMetaOptions,
  ) -> Result<RawForumThreadMeta, GetThreadMetaError> {
    let mut thread_id: Option<ForumThreadId> = None;
    let mut thread_key: Option<&ForumThreadKey> = None;
    match &options.thread {
      ForumThreadRef::Id(r) => thread_id = Some(r.id),
      ForumThreadRef::Key(r) => thread_key = Some(&r.key),
    };
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      forum_thread_id: ForumThreadId,
      key: Option<ForumThreadKey>,
      ctime: Instant,
      title: ForumThreadTitle,
      is_locked: bool,
      is_pinned: bool,
      forum_section_id: ForumSectionId,
      post_count: PgU32,
    }
    // language=PostgreSQL
    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
        SELECT
          forum_thread_id, key, ctime, title, is_locked, is_pinned, forum_section_id,
          post_count
        FROM forum_thread_meta
        WHERE forum_thread_id = $1::FORUM_THREAD_ID OR key = $2::FORUM_THREAD_KEY
        ;
    ",
    )
    .bind(thread_id)
    .bind(thread_key)
    .fetch_optional(self.database.as_ref())
    .await
    .map_err(|e| GetThreadMetaError::Other(Box::new(e)))?;
    let row = row.ok_or(GetThreadMetaError::NotFound)?;
    Ok(RawForumThreadMeta {
      id: row.forum_thread_id,
      key: row.key,
      title: row.title,
      section: row.forum_section_id.into(),
      ctime: row.ctime,
      is_pinned: row.is_pinned,
      is_locked: row.is_locked,
      posts: ListingCount {
        count: row.post_count.into(),
      },
    })
  }

  async fn create_thread(&self, options: &RawCreateThreadsOptions) -> Result<RawCreateForumThreadResult, AnyError> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    let forum_thread_id = ForumThreadId::from_uuid(self.uuid_generator.next());
    let (section_id, section_key) = options.section.split_deref();
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      ctime: Instant,
      forum_section_id: ForumSectionId,
    }
    // language=PostgreSQL
    let row: Row = sqlx::query_as::<_, Row>(
      r"
      WITH section AS (
        SELECT forum_section_id
        FROM forum_sections
        WHERE
        forum_section_id = $4::FORUM_SECTION_ID OR key = $5::FORUM_SECTION_KEY
      )
      INSERT INTO forum_threads(
        forum_thread_id, key, ctime,
        title, title_mtime,
        forum_section_id,
        is_pinned, is_pinned_mtime,
        is_locked, is_locked_mtime
      )
        (
          SELECT
            $2::FORUM_THREAD_ID AS forum_thread_id, NULL as key, $1::INSTANT AS ctime,
            $3::FORUM_THREAD_TITLE AS title, $1::INSTANT AS title_mtime,
            forum_section_id,
            FALSE AS is_pinned, $1::INSTANT AS is_pinned_mtime,
            FALSE AS is_locked, $1::INSTANT AS is_locked_mtime
          FROM section
        )
      RETURNING ctime, forum_section_id;
      ",
    )
    .bind(now)
    .bind(forum_thread_id)
    .bind(&options.title)
    .bind(section_id)
    .bind(&section_key)
    .fetch_one(&mut tx)
    .await?;
    let forum_section_id = row.forum_section_id;

    let forum_post_id = ForumPostId::from_uuid(self.uuid_generator.next());
    #[derive(Debug, sqlx::FromRow)]
    struct PostRow {
      ctime: Instant,
    }
    // language=PostgreSQL
    let _row: PostRow = sqlx::query_as::<_, PostRow>(
      r"
      INSERT INTO forum_posts(
        forum_post_id, ctime, forum_thread_id
      )
      VALUES (
        $2::FORUM_POST_ID, $1::INSTANT, $3::FORUM_THREAD_ID
      )
      RETURNING ctime;
      ",
    )
    .bind(now)
    .bind(forum_post_id)
    .bind(forum_thread_id)
    .fetch_one(&mut tx)
    .await?;

    let revision_id = ForumPostRevisionId::from_uuid(self.uuid_generator.next());
    let (raw_actor, user_actor_id) = match &options.actor {
      ForumActor::ClientForumActor(_) => todo!(),
      ForumActor::RoleForumActor(_) => todo!(),
      ForumActor::UserForumActor(a) => (
        RawForumActor::UserForumActor(RawUserForumActor {
          role: None,
          user: a.user.as_ref(),
        }),
        a.user.id,
      ),
    };
    let revision = RawForumPostRevision {
      id: revision_id,
      time: now,
      author: raw_actor,
      content: Some(ForumPostRevisionContent {
        marktwin: options.body_mkt.clone(),
        html: options.body_html.clone(),
      }),
      moderation: None,
      comment: None,
    };

    #[derive(Debug, sqlx::FromRow)]
    struct RevisionRow {
      time: Instant,
    }
    // language=PostgreSQL
    let row: RevisionRow = sqlx::query_as::<_, RevisionRow>(
      r"
      INSERT INTO forum_post_revisions(
        forum_post_revision_id, time, body, _html_body, mod_body, _html_mod_body, forum_post_id, author_id, comment
      )
      VALUES (
        $2::FORUM_POST_REVISION_ID, $1::INSTANT, $3::TEXT, $4::TEXT, NULL, NULL, $5::FORUM_POST_ID, $6::USER_ID, NULL
      )
      RETURNING time;
      ",
    )
    .bind(revision.time)
    .bind(revision.id)
    .bind(options.body_mkt.as_str())
    .bind(options.body_html.as_str())
    .bind(forum_post_id)
    .bind(user_actor_id)
    .fetch_one(&mut tx)
    .await?;

    tx.commit().await?;

    Ok(RawCreateForumThreadResult {
      id: forum_thread_id,
      key: None,
      title: options.title.clone(),
      section: forum_section_id.into(),
      ctime: row.time,
      is_pinned: false,
      is_locked: false,
      post_id: forum_post_id,
      post_revision: revision,
    })
  }

  async fn get_posts(&self, options: &RawGetPostsOptions) -> Result<Listing<RawShortForumPost>, AnyError> {
    let (thread_id, thread_key) = options.thread.split_deref();
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      count: PgU32,
      forum_post_id: ForumPostId,
      ctime: Instant,
      revision_count: PgU32,
      latest_revision_id: ForumPostRevisionId,
      latest_revision_time: Instant,
      latest_revision_body: Option<MarktwinText>,
      latest_revision_html_body: Option<HtmlFragment>,
      latest_revision_mod_body: Option<MarktwinText>,
      latest_revision_html_mod_body: Option<HtmlFragment>,
      latest_revision_comment: Option<ForumPostRevisionComment>,
      latest_revision_author_id: UserId,
      first_revision_author_id: UserId,
    }
    // TODO: Differentiate `notFound` from "empty"?
    // language=PostgreSQL
    let rows: Vec<Row> = sqlx::query_as::<_, Row>(
      r"
        WITH
          thread AS (
            SELECT forum_thread_id
            FROM forum_threads
            WHERE
              forum_thread_id = $1::FORUM_THREAD_ID OR key = $2::FORUM_THREAD_KEY
          ),
          items AS (
                    SELECT forum_post_id, ctime,
          LAST_VALUE(forum_post_revision_id) OVER w AS latest_revision_id,
          LAST_VALUE(time) OVER w AS latest_revision_time,
          LAST_VALUE(body) OVER w AS latest_revision_body,
          LAST_VALUE(_html_body) OVER w AS latest_revision_html_body,
          LAST_VALUE(mod_body) OVER w AS latest_revision_mod_body,
          LAST_VALUE(_html_mod_body) OVER w AS latest_revision_html_mod_body,
          LAST_VALUE(comment) OVER w AS latest_revision_comment,
          LAST_VALUE(author_id) OVER w AS latest_revision_author_id,
          FIRST_VALUE(author_id) OVER w AS first_revision_author_id,
                           COUNT(forum_post_revision_id) OVER w as revision_count,
          ROW_NUMBER() OVER w AS rn
        FROM forum_post_revisions
               INNER JOIN forum_posts USING (forum_post_id)
            WHERE forum_thread_id = (SELECT forum_thread_id FROM thread)
          WINDOW w AS (PARTITION BY forum_post_id ORDER BY time ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
          ),
          item_count AS (
            SELECT COUNT(*) AS count
            FROM items
          )
        SELECT count, items.*
        FROM item_count, items
        WHERE items.rn = 1
        ORDER BY ctime
        LIMIT $3::U32 OFFSET $4::U32
        ;
    ",
    )
      .bind(thread_id)
      .bind(thread_key)
      .bind(PgU32::from(options.limit))
      .bind(PgU32::from(options.offset))
      .fetch_all(self.database.as_ref())
      .await?;

    let mut count: u32 = 0;

    let items: Vec<_> = rows
      .into_iter()
      .map(|row| {
        count = row.count.into();
        RawShortForumPost {
          id: row.forum_post_id,
          ctime: row.ctime,
          author: RawForumActor::UserForumActor(RawUserForumActor {
            role: None,
            user: row.first_revision_author_id.into(),
          }),
          revisions: RawLatestForumPostRevisionListing {
            count: row.revision_count.into(),
            last: RawForumPostRevision {
              id: row.latest_revision_id,
              time: row.latest_revision_time,
              author: RawForumActor::UserForumActor(RawUserForumActor {
                role: None,
                user: row.latest_revision_author_id.into(),
              }),
              content: match (row.latest_revision_body, row.latest_revision_html_body) {
                (Some(marktwin), Some(html)) => Some(ForumPostRevisionContent { marktwin, html }),
                (None, None) => None,
                _ => todo!(),
              },
              moderation: match (row.latest_revision_mod_body, row.latest_revision_html_mod_body) {
                (Some(marktwin), Some(html)) => Some(ForumPostRevisionContent { marktwin, html }),
                (None, None) => None,
                _ => todo!(),
              },
              comment: row.latest_revision_comment,
            },
          },
        }
      })
      .collect();

    Ok(Listing {
      offset: options.offset,
      limit: options.limit,
      count,
      items,
    })
  }

  async fn create_post(&self, options: &RawCreatePostOptions) -> Result<RawCreateForumPostResult, AnyError> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    let (thread_id, thread_key) = options.thread.split_deref();

    let forum_post_id = ForumPostId::from_uuid(self.uuid_generator.next());
    #[derive(Debug, sqlx::FromRow)]
    struct PostRow {
      ctime: Instant,
      forum_thread_id: ForumThreadId,
      forum_section_id: ForumSectionId,
    }
    // language=PostgreSQL
    let row: PostRow = sqlx::query_as::<_, PostRow>(
      r"
      WITH thread AS (
        SELECT forum_thread_id
        FROM forum_threads
        WHERE
        forum_thread_id = $3::FORUM_THREAD_ID OR key = $4::FORUM_THREAD_KEY
      )
      INSERT INTO forum_posts(
        forum_post_id, ctime, forum_thread_id
      )
        (
          SELECT
            $2::FORUM_POST_ID AS forum_post_id,
            $1::INSTANT AS ctime,
            forum_thread_id
          FROM thread
        )
      RETURNING ctime, forum_thread_id, (SELECT forum_section_id FROM forum_threads WHERE forum_threads.forum_thread_id = forum_thread_id) AS forum_section_id;
      ",
    )
    .bind(now)
    .bind(forum_post_id)
    .bind(thread_id)
    .bind(&thread_key)
    .fetch_one(&mut tx)
    .await?;

    let forum_thread_id = row.forum_thread_id;
    let forum_section_id = row.forum_section_id;

    let revision_id = ForumPostRevisionId::from_uuid(self.uuid_generator.next());
    let (raw_actor, user_actor_id) = match &options.actor {
      ForumActor::ClientForumActor(_) => todo!(),
      ForumActor::RoleForumActor(_) => todo!(),
      ForumActor::UserForumActor(a) => (
        RawForumActor::UserForumActor(RawUserForumActor {
          role: None,
          user: a.user.as_ref(),
        }),
        a.user.id,
      ),
    };
    let revision = RawForumPostRevision {
      id: revision_id,
      time: now,
      author: raw_actor,
      content: Some(ForumPostRevisionContent {
        marktwin: options.body_mkt.clone(),
        html: options.body_html.clone(),
      }),
      moderation: None,
      comment: None,
    };

    #[derive(Debug, sqlx::FromRow)]
    struct RevisionRow {
      time: Instant,
    }
    // language=PostgreSQL
    let _row: RevisionRow = sqlx::query_as::<_, RevisionRow>(
      r"
      INSERT INTO forum_post_revisions(
        forum_post_revision_id, time, body, _html_body, mod_body, _html_mod_body, forum_post_id, author_id, comment
      )
      VALUES (
        $2::FORUM_POST_REVISION_ID, $1::INSTANT, $3::TEXT, $4::TEXT, NULL, NULL, $5::FORUM_POST_ID, $6::USER_ID, NULL
      )
      RETURNING time;
      ",
    )
    .bind(revision.time)
    .bind(revision.id)
    .bind(options.body_mkt.as_str())
    .bind(options.body_html.as_str())
    .bind(forum_post_id)
    .bind(user_actor_id)
    .fetch_one(&mut tx)
    .await?;

    tx.commit().await?;

    Ok(RawCreateForumPostResult {
      id: forum_post_id,
      thread: forum_thread_id.into(),
      section: forum_section_id.into(),
      revision,
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
    // language=PostgreSQL
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
