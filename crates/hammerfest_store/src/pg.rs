use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, Secret};
use etwin_core::email::touch_email_address;
use etwin_core::hammerfest::{
  hammerfest_reply_count_to_page_count, GetHammerfestUserOptions, HammerfestDate, HammerfestDateTime,
  HammerfestForumPostId, HammerfestForumRole, HammerfestForumThemeDescription, HammerfestForumThemeId,
  HammerfestForumThemeIdRef, HammerfestForumThemePageResponse, HammerfestForumThemeTitle, HammerfestForumThreadIdRef,
  HammerfestForumThreadKind, HammerfestForumThreadPageResponse, HammerfestForumThreadTitle,
  HammerfestGodchildrenResponse, HammerfestInventoryResponse, HammerfestItemId, HammerfestLadderLevel,
  HammerfestProfileResponse, HammerfestQuestId, HammerfestQuestStatus, HammerfestServer, HammerfestSessionUser,
  HammerfestShop, HammerfestShopResponse, HammerfestStore, HammerfestUserId, HammerfestUserIdRef, HammerfestUsername,
  ShortHammerfestUser, StoredHammerfestUser,
};
use etwin_core::types::EtwinError;
use etwin_core::uuid::UuidGenerator;
use etwin_populate::hammerfest::populate_hammerfest;
use etwin_postgres_tools::upsert_archive_query;
use sha3::{Digest, Sha3_256};
use sqlx::postgres::PgQueryResult;
use sqlx::types::Uuid;
use sqlx::{PgPool, Postgres, Transaction};
use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::convert::{TryFrom, TryInto};
use std::error::Error;
use std::num::NonZeroU16;

pub struct PgHammerfestStore<TyClock, TyDatabase, TyUuidGenerator>
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

fn box_sqlx_error(e: sqlx::Error) -> Box<dyn Error + Send> {
  Box::new(e)
}

impl<TyClock, TyDatabase, TyUuidGenerator> PgHammerfestStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  pub async fn new(
    clock: TyClock,
    database: TyDatabase,
    database_secret: Secret,
    uuid_generator: TyUuidGenerator,
  ) -> Result<Self, Box<dyn Error + Send>> {
    let mut tx = database.as_ref().begin().await.map_err(box_sqlx_error)?;
    populate_hammerfest(&mut tx).await?;
    tx.commit().await.map_err(box_sqlx_error)?;
    Ok(Self {
      clock,
      database,
      database_secret,
      uuid_generator,
    })
  }
}

async fn touch_hammerfest_user(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: &ShortHammerfestUser,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(
    r"
      INSERT
      INTO hammerfest_users(hammerfest_server, hammerfest_user_id, username, archived_at)
      VALUES (
        $1::HAMMERFEST_SERVER, $2::HAMMERFEST_USER_ID, $3::HAMMERFEST_USERNAME, $4::INSTANT
      )
      ON CONFLICT (hammerfest_server, hammerfest_user_id) DO UPDATE SET username = $3::HAMMERFEST_USERNAME;
      ",
  )
  .bind(user.server)
  .bind(user.id)
  .bind(user.username.as_str())
  .bind(now)
  .execute(tx)
  .await?;
  assert_eq!(res.rows_affected(), 1);
  Ok(())
}

async fn touch_hammerfest_forum_theme(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  server: HammerfestServer,
  id: HammerfestForumThemeId,
  title: &HammerfestForumThemeTitle,
  description: Option<&HammerfestForumThemeDescription>,
  is_public: bool,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(
    r"
      INSERT
      INTO hammerfest_forum_themes(hammerfest_server, hammerfest_theme_id, archived_at, title, description, is_public)
      VALUES (
        $1::HAMMERFEST_SERVER, $2::HAMMERFEST_FORUM_THEME_ID, $3::INSTANT, $4::HAMMERFEST_FORUM_THEME_TITLE, $5::HAMMERFEST_FORUM_THEME_DESCRIPTION, $6::BOOLEAN
      )
      ON CONFLICT (hammerfest_server, hammerfest_theme_id)
        DO UPDATE SET
          title = $4::HAMMERFEST_FORUM_THEME_TITLE,
          description = COALESCE(EXCLUDED.description, $5::HAMMERFEST_FORUM_THEME_DESCRIPTION),
          is_public = $6::BOOLEAN;
      ",
  )
    .bind(server)
    .bind(id)
    .bind(now)
    .bind(title)
    .bind(description)
    .bind(is_public)
    .execute(tx)
    .await?;
  assert_eq!(res.rows_affected(), 1);
  Ok(())
}

async fn touch_hammerfest_forum_theme_count(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  theme: HammerfestForumThemeIdRef,
  page_count: NonZeroU16,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_theme_counts(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_theme_id::HAMMERFEST_FORUM_THEME_ID),
      data($4 page_count::U16),
    )
  ))
  .bind(now)
  .bind(theme.server)
  .bind(theme.id)
  .bind(i32::from(page_count.get()))
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

#[derive(Debug, Copy, Clone, Eq, PartialEq)]
enum ThemePage {
  Sticky,
  Regular(NonZeroU16),
}

async fn touch_hammerfest_forum_theme_page_count(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  theme: HammerfestForumThemeIdRef,
  page: ThemePage,
  thread_count: u8,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_theme_page_counts(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_theme_id::HAMMERFEST_FORUM_THEME_ID, $4 page::U16),
      data($5 thread_count::U8),
    )
  ))
  .bind(now)
  .bind(theme.server)
  .bind(theme.id)
  .bind(match page {
    ThemePage::Sticky => 0,
    ThemePage::Regular(page) => i32::from(page.get()),
  })
  .bind(i16::from(thread_count))
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

async fn touch_hammerfest_forum_thread_page_count(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  thread: HammerfestForumThreadIdRef,
  page: NonZeroU16,
  post_count: u8,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_thread_page_counts(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_thread_id::HAMMERFEST_FORUM_THREAD_ID, $4 page::U16),
      data($5 post_count::U8),
    )
  ))
  .bind(now)
  .bind(thread.server)
  .bind(thread.id)
  .bind(i32::from(page.get()))
  .bind(i16::from(post_count))
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

async fn touch_hammerfest_forum_theme_page_item(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  theme: HammerfestForumThemeIdRef,
  page: ThemePage,
  offset: u8,
  thread: HammerfestForumThreadIdRef,
) -> Result<(), EtwinError> {
  assert_eq!(thread.server, theme.server);
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_theme_threads(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_theme_id::HAMMERFEST_FORUM_THEME_ID, $4 page::U16, $5 offset_in_list::U8),
      data($6 hammerfest_thread_id::HAMMERFEST_FORUM_THREAD_ID),
    )
  ))
  .bind(now)
  .bind(theme.server)
  .bind(theme.id)
  .bind(match page {
    ThemePage::Sticky => 0,
    ThemePage::Regular(page) => i32::from(page.get()),
  })
    .bind(i16::from(offset))
  .bind(thread.id)
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 2 invalidated (primary + thread_id)
  assert!((1..=3u64).contains(&res.rows_affected()));
  Ok(())
}

async fn touch_hammerfest_forum_thread(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  thread: HammerfestForumThreadIdRef,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(
    r"
      INSERT
      INTO hammerfest_forum_threads(hammerfest_server, hammerfest_thread_id, archived_at)
      VALUES (
        $1::HAMMERFEST_SERVER, $2::HAMMERFEST_FORUM_THREAD_ID, $3::INSTANT
      )
      ON CONFLICT (hammerfest_server, hammerfest_thread_id) DO NOTHING;
      ",
  )
  .bind(thread.server)
  .bind(thread.id)
  .bind(now)
  .execute(tx)
  .await?;
  assert!((0..=1u64).contains(&res.rows_affected()));
  Ok(())
}

async fn touch_hammerfest_forum_thread_shared_meta(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  thread: HammerfestForumThreadIdRef,
  theme_id: HammerfestForumThemeId,
  title: &HammerfestForumThreadTitle,
  is_closed: bool,
  page_count: NonZeroU16,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_thread_shared_meta(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_thread_id::HAMMERFEST_FORUM_THREAD_ID),
      data($4 hammerfest_theme_id::HAMMERFEST_FORUM_THEME_ID, $5 title::HAMMERFEST_FORUM_THREAD_TITLE, $6 is_closed::BOOLEAN, $7 page_count::U32),
    )
  ))
    .bind(now)
    .bind(thread.server)
    .bind(thread.id)
    .bind(theme_id)
    .bind(title.as_str())
    .bind(is_closed)
    .bind(i64::from(page_count.get()))
    .execute(&mut *tx)
    .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn touch_hammerfest_forum_thread_theme_meta(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  thread: HammerfestForumThreadIdRef,
  is_sticky: bool,
  latest_post_at: Option<HammerfestDate>,
  author: HammerfestUserId,
  reply_count: u16,
) -> Result<(), EtwinError> {
  assert_eq!(is_sticky, latest_post_at.is_none());
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_thread_theme_meta(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_thread_id::HAMMERFEST_FORUM_THREAD_ID),
      data($4 is_sticky::BOOLEAN, $5 latest_post_at::HAMMERFEST_DATE, $6 author::HAMMERFEST_USER_ID, $7 reply_count::U16),
    )
  ))
    .bind(now)
    .bind(thread.server)
    .bind(thread.id)
    .bind(is_sticky)
    .bind(latest_post_at)
    .bind(author)
    .bind(i64::from(reply_count))
    .execute(&mut *tx)
    .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn touch_hammerfest_forum_post(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  thread: HammerfestForumThreadIdRef,
  page: NonZeroU16,
  offset: u8,
  author: HammerfestUserId,
  posted_at: HammerfestDateTime,
  remote_html_body: &str,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_posts(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_thread_id::HAMMERFEST_FORUM_THREAD_ID, $4 page::U16, $5 offset_in_list::U8),
      data($6 author::HAMMERFEST_USER_ID, $7 posted_at::HAMMERFEST_DATE_TIME, $8 remote_html_body::TEXT),
    )
  ))
    .bind(now)
    .bind(thread.server)
    .bind(thread.id)
    .bind(i32::from(page.get()))
    .bind(i16::from(offset))
    .bind(author)
    .bind(posted_at)
    .bind(remote_html_body)
    .execute(&mut *tx)
    .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

async fn touch_hammerfest_forum_post_id(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  thread: HammerfestForumThreadIdRef,
  page: NonZeroU16,
  offset: u8,
  post_id: HammerfestForumPostId,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_post_ids(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_thread_id::HAMMERFEST_FORUM_THREAD_ID, $4 page::U16, $5 offset_in_list::U8),
      data($6 hammerfest_post_id::HAMMERFEST_FORUM_POST_ID),
      unique(mid(hammerfest_server, hammerfest_post_id)),
    )
  ))
    .bind(now)
    .bind(thread.server)
    .bind(thread.id)
    .bind(i32::from(page.get()))
    .bind(i16::from(offset))
    .bind(post_id)
    .execute(&mut *tx)
    .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (first insert), 1 invalidated (mid)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  // 3 : 1 inserted (data change), 1 invalidated (primary), 1 invalidated (mid)
  assert!((1..=3u64).contains(&res.rows_affected()));

  Ok(())
}

async fn touch_hammerfest_quest_statuses(
  tx: &mut Transaction<'_, Postgres>,
  quests: &HashMap<HammerfestQuestId, HammerfestQuestStatus>,
  new_id: Uuid,
) -> Result<Uuid, EtwinError> {
  let sorted: BTreeMap<HammerfestQuestId, HammerfestQuestStatus> = quests.iter().map(|(k, v)| (*k, *v)).collect();
  let hash = {
    let json = serde_json::to_string(&sorted).unwrap();
    let hash = Sha3_256::digest(json.as_bytes());
    hash
  };

  let map_id = {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      hammerfest_quest_status_map_id: Uuid,
    }
    let row: Row = sqlx::query_as::<_, Row>(
      r"
      WITH
        input_row(hammerfest_quest_status_map_id, _sha3_256) AS (
          VALUES($1::HAMMERFEST_QUEST_STATUS_MAP_ID, $2::BYTEA)
        ),
        inserted_rows AS (
          INSERT
          INTO hammerfest_quest_status_maps(hammerfest_quest_status_map_id, _sha3_256)
          SELECT * FROM input_row
          ON CONFLICT DO NOTHING
          RETURNING hammerfest_quest_status_map_id
        )
      SELECT hammerfest_quest_status_map_id FROM inserted_rows
      UNION ALL
      SELECT old.hammerfest_quest_status_map_id FROM hammerfest_quest_status_maps AS old INNER JOIN input_row USING(_sha3_256);
      ",
    )
      .bind(new_id)
      .bind(hash.as_slice())
      .fetch_one(&mut *tx)
      .await?;

    row.hammerfest_quest_status_map_id
  };

  if map_id == new_id {
    // Newly created map: fill its content
    for (qid, status) in sorted.iter() {
      let res: PgQueryResult = sqlx::query(
        r"
        INSERT
        INTO hammerfest_quest_status_map_items(hammerfest_quest_status_map_id, hammerfest_quest_id, status)
        VALUES ($1::HAMMERFEST_QUEST_STATUS_MAP_ID, $2::HAMMERFEST_QUEST_ID, $3::HAMMERFEST_QUEST_STATUS);
      ",
      )
      .bind(map_id)
      .bind(qid)
      .bind(status)
      .execute(&mut *tx)
      .await?;
      assert_eq!(res.rows_affected(), 1);
    }
  } else {
    // Re-using old id, check for hash collision
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      hammerfest_quest_id: HammerfestQuestId,
      status: HammerfestQuestStatus,
    }

    let rows: Vec<Row> = sqlx::query_as::<_, Row>(
      r"
      SELECT hammerfest_quest_id, status
      FROM hammerfest_quest_status_map_items
      WHERE hammerfest_quest_status_map_id = $1::HAMMERFEST_QUEST_STATUS_MAP_ID;
    ",
    )
    .bind(map_id)
    .fetch_all(&mut *tx)
    .await?;

    let actual: BTreeMap<HammerfestQuestId, HammerfestQuestStatus> =
      rows.iter().map(|r| (r.hammerfest_quest_id, r.status)).collect();

    assert_eq!(actual, sorted);
  }

  Ok(map_id)
}

async fn touch_hammerfest_unlocked_items(
  tx: &mut Transaction<'_, Postgres>,
  items: &HashSet<HammerfestItemId>,
  new_id: Uuid,
) -> Result<Uuid, EtwinError> {
  let sorted: BTreeSet<HammerfestItemId> = items.iter().copied().collect();
  let hash = {
    let json = serde_json::to_string(&sorted).unwrap();
    let hash = Sha3_256::digest(json.as_bytes());
    hash
  };

  let set_id = {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      hammerfest_unlocked_item_set_id: Uuid,
    }
    let row: Row = sqlx::query_as::<_, Row>(
      r"
      WITH
        input_row(hammerfest_unlocked_item_set_id, _sha3_256) AS (
          VALUES($1::HAMMERFEST_UNLOCKED_ITEM_SET_ID, $2::BYTEA)
        ),
        inserted_rows AS (
          INSERT
          INTO hammerfest_unlocked_item_sets(hammerfest_unlocked_item_set_id, _sha3_256)
          SELECT * FROM input_row
          ON CONFLICT DO NOTHING
          RETURNING hammerfest_unlocked_item_set_id
        )
      SELECT hammerfest_unlocked_item_set_id FROM inserted_rows
      UNION ALL
      SELECT old.hammerfest_unlocked_item_set_id FROM hammerfest_unlocked_item_sets AS old INNER JOIN input_row USING(_sha3_256);
      ",
    )
      .bind(new_id)
      .bind(hash.as_slice())
      .fetch_one(&mut *tx)
      .await?;

    row.hammerfest_unlocked_item_set_id
  };

  if set_id == new_id {
    // Newly created map: fill its content
    for iid in sorted.iter() {
      let res: PgQueryResult = sqlx::query(
        r"
        INSERT
        INTO hammerfest_unlocked_item_set_items(hammerfest_unlocked_item_set_id, hammerfest_item_id)
        VALUES ($1::HAMMERFEST_UNLOCKED_ITEM_SET_ID, $2::HAMMERFEST_ITEM_ID);
      ",
      )
      .bind(set_id)
      .bind(iid)
      .execute(&mut *tx)
      .await?;
      assert_eq!(res.rows_affected(), 1);
    }
  } else {
    // Re-using old id, check for hash collision
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      hammerfest_item_id: HammerfestItemId,
    }

    let rows: Vec<Row> = sqlx::query_as::<_, Row>(
      r"
      SELECT hammerfest_item_id
      FROM hammerfest_unlocked_item_set_items
      WHERE hammerfest_unlocked_item_set_id = $1::HAMMERFEST_UNLOCKED_ITEM_SET_ID;
    ",
    )
    .bind(set_id)
    .fetch_all(&mut *tx)
    .await?;

    let actual: BTreeSet<HammerfestItemId> = rows.iter().map(|r| r.hammerfest_item_id).collect();

    assert_eq!(actual, sorted);
  }

  Ok(set_id)
}

async fn touch_hammerfest_item_counts(
  tx: &mut Transaction<'_, Postgres>,
  items: &HashMap<HammerfestItemId, u32>,
  new_id: Uuid,
) -> Result<Uuid, EtwinError> {
  let sorted: BTreeMap<HammerfestItemId, u32> = items.iter().map(|(k, v)| (*k, *v)).collect();
  let hash = {
    let json = serde_json::to_string(&sorted).unwrap();
    let hash = Sha3_256::digest(json.as_bytes());
    hash
  };

  let map_id = {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      hammerfest_item_count_map_id: Uuid,
    }
    let row: Row = sqlx::query_as::<_, Row>(
      r"
      WITH
        input_row(hammerfest_item_count_map_id, _sha3_256) AS (
          VALUES($1::HAMMERFEST_ITEM_COUNT_MAP_ID, $2::BYTEA)
        ),
        inserted_rows AS (
          INSERT
          INTO hammerfest_item_count_maps(hammerfest_item_count_map_id, _sha3_256)
          SELECT * FROM input_row
          ON CONFLICT DO NOTHING
          RETURNING hammerfest_item_count_map_id
        )
      SELECT hammerfest_item_count_map_id FROM inserted_rows
      UNION ALL
      SELECT old.hammerfest_item_count_map_id FROM hammerfest_item_count_maps AS old INNER JOIN input_row USING(_sha3_256);
      ",
    )
      .bind(new_id)
      .bind(hash.as_slice())
      .fetch_one(&mut *tx)
      .await?;

    row.hammerfest_item_count_map_id
  };

  if map_id == new_id {
    // Newly created map: fill its content
    for (id, count) in sorted.iter() {
      let res: PgQueryResult = sqlx::query(
        r"
        INSERT
        INTO hammerfest_item_count_map_items(hammerfest_item_count_map_id, hammerfest_item_id, count)
        VALUES ($1::HAMMERFEST_ITEM_COUNT_MAP_ID, $2::HAMMERFEST_ITEM_ID, $3::U32);
      ",
      )
      .bind(map_id)
      .bind(id)
      .bind(i32::try_from(*count).unwrap()) // TODO: Handle overflow
      .execute(&mut *tx)
      .await?;
      assert_eq!(res.rows_affected(), 1);
    }
  } else {
    // Re-using old id, check for hash collision
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      hammerfest_item_id: HammerfestItemId,
      count: u32,
    }

    let rows: Vec<Row> = sqlx::query_as::<_, Row>(
      r"
      SELECT hammerfest_item_id, count
      FROM hammerfest_item_count_map_items
      WHERE hammerfest_item_count_map_id = $1::HAMMERFEST_ITEM_COUNT_MAP_ID;
    ",
    )
    .bind(map_id)
    .fetch_all(&mut *tx)
    .await?;

    let actual: BTreeMap<HammerfestItemId, u32> = rows.iter().map(|r| (r.hammerfest_item_id, r.count)).collect();

    assert_eq!(actual, sorted);
  }

  Ok(map_id)
}

#[allow(clippy::too_many_arguments)]
async fn touch_hammerfest_session_user(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  session_user: &HammerfestSessionUser,
) -> Result<(), EtwinError> {
  touch_hammerfest_user(tx, now, &session_user.user).await?;
  touch_hammerfest_tokens(tx, now, session_user.user.as_ref(), session_user.tokens).await?;
  Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn touch_hammerfest_profile(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: HammerfestUserIdRef,
  best_score: u32,
  best_level: u8,
  season_score: u32,
  quests: Uuid,
  unlocked_items: Uuid,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_profiles(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID),
      data($4 best_score::U32, $5 best_level::U32, $6 season_score::U32, $7 quest_statuses::HAMMERFEST_QUEST_STATUS_MAP_ID, $8 unlocked_items::HAMMERFEST_UNLOCKED_ITEM_SET_ID),
    )
  ))
    .bind(now)
    .bind(user.server)
    .bind(user.id)
    .bind(best_score)
    .bind(i16::from(best_level))
    .bind(season_score)
    .bind(quests)
    .bind(unlocked_items)
    .execute(&mut *tx)
    .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

async fn touch_hammerfest_email(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: HammerfestUserIdRef,
  email_hash: Option<Vec<u8>>,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_emails(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID),
      data($4 email::EMAIL_ADDRESS_HASH),
      unique(email(hammerfest_server, email)),
    )
  ))
  .bind(now)
  .bind(user.server)
  .bind(user.id)
  .bind(&email_hash)
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (first insert), 1 invalidated (email)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  // 3 : 1 inserted (data change), 1 invalidated (primary), 1 invalidated (email)
  assert!((1..=3u64).contains(&res.rows_affected()));
  Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn touch_hammerfest_achievements(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: HammerfestUserIdRef,
  has_carrot: bool,
  ladder_level: HammerfestLadderLevel,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_user_achievements(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID),
      data($4 has_carrot::BOOLEAN, $5 ladder_level::HAMMERFEST_LADDER_LEVEL),
    )
  ))
  .bind(now)
  .bind(user.server)
  .bind(user.id)
  .bind(has_carrot)
  .bind(ladder_level)
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn touch_hammerfest_best_season_rank(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: HammerfestUserIdRef,
  season_rank: Option<u32>,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_best_season_ranks(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID),
      data($4 best_season_rank::U32?),
    )
  ))
  .bind(now)
  .bind(user.server)
  .bind(user.id)
  .bind(season_rank.map(i64::from))
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn touch_hammerfest_forum_role(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: HammerfestUserIdRef,
  role: HammerfestForumRole,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_roles(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID),
      data($4 role::HAMMERFEST_FORUM_ROLE),
    )
  ))
  .bind(now)
  .bind(user.server)
  .bind(user.id)
  .bind(role)
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn touch_hammerfest_inventory(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: HammerfestUserIdRef,
  items: Uuid,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_inventories(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID),
      data($4 item_counts::HAMMERFEST_ITEM_COUNT_MAP_ID),
    )
  ))
  .bind(now)
  .bind(user.server)
  .bind(user.id)
  .bind(items)
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn touch_hammerfest_shop(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: HammerfestUserIdRef,
  shop: &HammerfestShop,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_shops(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID),
      data($4 weekly_tokens::U8, $5 purchased_tokens::U8?, $6 has_quest_bonus::BOOLEAN),
    )
  ))
  .bind(now)
  .bind(user.server)
  .bind(user.id)
  .bind(i32::from(shop.weekly_tokens))
  .bind(shop.purchased_tokens.map(i16::from))
  .bind(shop.has_quest_bonus)
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn touch_hammerfest_tokens(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: HammerfestUserIdRef,
  tokens: u32,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_tokens(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID),
      data($4 tokens::U32),
    )
  ))
  .bind(now)
  .bind(user.server)
  .bind(user.id)
  .bind(i64::from(tokens))
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn touch_hammerfest_godchild_list(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  godfather: HammerfestUserIdRef,
  godchild_count: u32,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_godchild_lists(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID),
      data($4 godchild_count::U32),
    )
  ))
  .bind(now)
  .bind(godfather.server)
  .bind(godfather.id)
  .bind(i64::from(godchild_count))
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn touch_hammerfest_godchild(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  godfather: HammerfestUserIdRef,
  offset_in_list: u32,
  godchild: HammerfestUserIdRef,
  tokens: u32,
) -> Result<(), EtwinError> {
  assert_eq!(godchild.server, godfather.server);
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_godchildren(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID, $4 offset_in_list::U32),
      data($5 godchild_id::HAMMERFEST_USER_ID, $6 tokens::U32),
      unique(godchild(hammerfest_server, godchild_id)),
    )
  ))
  .bind(now)
  .bind(godfather.server)
  .bind(godfather.id)
  .bind(i64::from(offset_in_list))
  .bind(godchild.id)
  .bind(i64::from(tokens))
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 3 : 1 inserted (data change), 2 invalidated (primary, unique godchild)
  assert!((1..=3u64).contains(&res.rows_affected()));
  // TODO: Invalidate parent list a godchild is invalidated
  Ok(())
}

#[async_trait]
impl<TyClock, TyDatabase, TyUuidGenerator> HammerfestStore for PgHammerfestStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  async fn get_short_user(
    &self,
    options: &GetHammerfestUserOptions,
  ) -> Result<Option<ShortHammerfestUser>, EtwinError> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      hammerfest_server: HammerfestServer,
      hammerfest_user_id: HammerfestUserId,
      username: HammerfestUsername,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
      SELECT hammerfest_server, hammerfest_user_id, username
      FROM hammerfest_users
      WHERE hammerfest_server = $1::HAMMERFEST_SERVER AND hammerfest_user_id = $2::HAMMERFEST_USER_ID;
    ",
    )
    .bind(&options.server)
    .bind(&options.id)
    .fetch_optional(self.database.as_ref())
    .await?;

    Ok(row.map(|r| ShortHammerfestUser {
      server: r.hammerfest_server,
      id: r.hammerfest_user_id,
      username: r.username,
    }))
  }

  async fn get_user(&self, options: &GetHammerfestUserOptions) -> Result<Option<StoredHammerfestUser>, EtwinError> {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      hammerfest_server: HammerfestServer,
      hammerfest_user_id: HammerfestUserId,
      username: HammerfestUsername,
      archived_at: Instant,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
      SELECT hammerfest_server, hammerfest_user_id, username, archived_at
      FROM hammerfest_users
      WHERE hammerfest_server = $1::HAMMERFEST_SERVER AND hammerfest_user_id = $2::HAMMERFEST_USER_ID;
    ",
    )
    .bind(&options.server)
    .bind(&options.id)
    .fetch_optional(self.database.as_ref())
    .await?;

    Ok(row.map(|r| StoredHammerfestUser {
      server: r.hammerfest_server,
      id: r.hammerfest_user_id,
      username: r.username,
      archived_at: r.archived_at,
      profile: None,
      items: None,
    }))
  }

  async fn touch_short_user(&self, user: &ShortHammerfestUser) -> Result<StoredHammerfestUser, EtwinError> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    touch_hammerfest_user(&mut tx, now, user).await?;
    tx.commit().await?;
    Ok(StoredHammerfestUser {
      server: user.server,
      id: user.id,
      username: user.username.clone(),
      archived_at: now,
      profile: None,
      items: None,
    })
  }

  async fn touch_shop(&self, response: &HammerfestShopResponse) -> Result<(), EtwinError> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    touch_hammerfest_session_user(&mut tx, now, &response.session_user).await?;
    touch_hammerfest_shop(&mut tx, now, response.session_user.user.as_ref(), &response.shop).await?;
    tx.commit().await?;
    Ok(())
  }

  async fn touch_profile(&self, response: &HammerfestProfileResponse) -> Result<(), EtwinError> {
    assert_eq!(
      response.session_user.is_some(),
      response.profile.email.is_some(),
      "session user presence must match email knowledge presence"
    );
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    if let Some(session_user) = response.session_user.as_ref() {
      touch_hammerfest_session_user(&mut tx, now, &session_user).await?;
    }
    let options = &response.profile;
    touch_hammerfest_user(&mut tx, now, &options.user).await?;
    let quests = touch_hammerfest_quest_statuses(&mut tx, &options.quests, self.uuid_generator.next()).await?;
    let unlocked_items = touch_hammerfest_unlocked_items(&mut tx, &options.items, self.uuid_generator.next()).await?;
    touch_hammerfest_profile(
      &mut tx,
      now,
      options.user.as_ref(),
      options.best_score,
      options.best_level,
      options.season_score,
      quests,
      unlocked_items,
    )
    .await?;
    if let Some(email) = &options.email {
      let email_hash = if let Some(email) = &email {
        let email_hash = touch_email_address(&mut tx, &self.database_secret, email, now).await?;
        Some(email_hash)
      } else {
        None
      };
      touch_hammerfest_email(&mut tx, now, options.user.as_ref(), email_hash).await?;
    }
    touch_hammerfest_achievements(
      &mut tx,
      now,
      options.user.as_ref(),
      options.has_carrot,
      options.ladder_level,
    )
    .await?;

    tx.commit().await?;

    Ok(())
  }

  async fn touch_inventory(&self, response: &HammerfestInventoryResponse) -> Result<(), EtwinError> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    touch_hammerfest_session_user(&mut tx, now, &response.session_user).await?;
    let inventory = &response.inventory;
    let items = touch_hammerfest_item_counts(&mut tx, inventory, self.uuid_generator.next()).await?;
    touch_hammerfest_inventory(&mut tx, now, response.session_user.user.as_ref(), items).await?;
    tx.commit().await?;

    Ok(())
  }

  async fn touch_godchildren(&self, response: &HammerfestGodchildrenResponse) -> Result<(), EtwinError> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    touch_hammerfest_session_user(&mut tx, now, &response.session_user).await?;
    touch_hammerfest_godchild_list(
      &mut tx,
      now,
      response.session_user.user.as_ref(),
      response.godchildren.len().try_into().expect("OverflowOnGodchildCount"),
    )
    .await?;
    for (offset_in_list, godchild) in response.godchildren.iter().enumerate() {
      touch_hammerfest_user(&mut tx, now, &godchild.user).await?;
      touch_hammerfest_godchild(
        &mut tx,
        now,
        response.session_user.user.as_ref(),
        offset_in_list.try_into().expect("OverflowOnGodchildOffest"),
        godchild.user.as_ref(),
        godchild.tokens,
      )
      .await?;
    }
    tx.commit().await?;

    Ok(())
  }

  async fn touch_theme_page(&self, response: &HammerfestForumThemePageResponse) -> Result<(), EtwinError> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    if let Some(session_user) = response.session_user.as_ref() {
      touch_hammerfest_session_user(&mut tx, now, &session_user).await?;
    }
    let options = &response.page;
    touch_hammerfest_forum_theme(
      &mut tx,
      now,
      options.theme.server,
      options.theme.id,
      &options.theme.name,
      None,
      options.theme.is_public,
    )
    .await?;
    touch_hammerfest_forum_theme_count(&mut tx, now, options.theme.as_ref(), options.threads.pages).await?;
    touch_hammerfest_forum_theme_page_count(
      &mut tx,
      now,
      options.theme.as_ref(),
      ThemePage::Sticky,
      options.sticky.len().try_into().expect("OverflowOnStickyThreadCount"),
    )
    .await?;

    for (offset, sticky) in options.sticky.iter().enumerate() {
      assert!(matches!(sticky.kind, HammerfestForumThreadKind::Sticky));
      touch_hammerfest_forum_thread(&mut tx, now, sticky.as_ref()).await?;
      touch_hammerfest_forum_theme_page_item(
        &mut tx,
        now,
        options.theme.as_ref(),
        ThemePage::Sticky,
        offset.try_into().expect("OverflowOnStickyThreadOffset"),
        sticky.as_ref(),
      )
      .await?;
      touch_hammerfest_forum_thread_shared_meta(
        &mut tx,
        now,
        sticky.as_ref(),
        options.theme.id,
        &sticky.short.name,
        sticky.short.is_closed,
        hammerfest_reply_count_to_page_count(sticky.reply_count),
      )
      .await?;
      touch_hammerfest_user(&mut tx, now, &sticky.author).await?;
      touch_hammerfest_forum_role(&mut tx, now, sticky.author.as_ref(), sticky.author_role).await?;
      touch_hammerfest_forum_thread_theme_meta(
        &mut tx,
        now,
        sticky.as_ref(),
        true,
        None,
        sticky.author.id,
        sticky.reply_count,
      )
      .await?;
    }
    let page = ThemePage::Regular(options.threads.page1);
    touch_hammerfest_forum_theme_page_count(
      &mut tx,
      now,
      options.theme.as_ref(),
      page,
      options
        .threads
        .items
        .len()
        .try_into()
        .expect("OverflowOnRegularThreadCount"),
    )
    .await?;
    for (offset, thread) in options.threads.items.iter().enumerate() {
      let last_post_date = match thread.kind {
        HammerfestForumThreadKind::Regular {
          latest_post_date: last_post_date,
        } => last_post_date,
        _ => unreachable!(),
      };
      touch_hammerfest_forum_thread(&mut tx, now, thread.as_ref()).await?;
      touch_hammerfest_forum_theme_page_item(
        &mut tx,
        now,
        options.theme.as_ref(),
        page,
        offset.try_into().expect("OverflowOnRegularThreadOffset"),
        thread.as_ref(),
      )
      .await?;
      touch_hammerfest_forum_thread_shared_meta(
        &mut tx,
        now,
        thread.as_ref(),
        options.theme.id,
        &thread.short.name,
        thread.short.is_closed,
        hammerfest_reply_count_to_page_count(thread.reply_count),
      )
      .await?;
      touch_hammerfest_user(&mut tx, now, &thread.author).await?;
      touch_hammerfest_forum_role(&mut tx, now, thread.author.as_ref(), thread.author_role).await?;
      touch_hammerfest_forum_thread_theme_meta(
        &mut tx,
        now,
        thread.as_ref(),
        false,
        Some(last_post_date),
        thread.author.id,
        thread.reply_count,
      )
      .await?;
    }

    tx.commit().await?;

    Ok(())
  }

  async fn touch_thread_page(&self, response: &HammerfestForumThreadPageResponse) -> Result<(), EtwinError> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    let mut session_user_is_moderator = false;
    if let Some(session_user) = response.session_user.as_ref() {
      touch_hammerfest_session_user(&mut tx, now, &session_user).await?;
    }
    let options = &response.page;
    touch_hammerfest_forum_theme(
      &mut tx,
      now,
      options.theme.server,
      options.theme.id,
      &options.theme.name,
      None,
      options.theme.is_public,
    )
    .await?;
    touch_hammerfest_forum_thread(&mut tx, now, options.thread.as_ref()).await?;
    touch_hammerfest_forum_thread_shared_meta(
      &mut tx,
      now,
      options.thread.as_ref(),
      options.theme.id,
      &options.thread.name,
      options.thread.is_closed,
      options.posts.pages,
    )
    .await?;

    touch_hammerfest_forum_thread_page_count(
      &mut tx,
      now,
      options.thread.as_ref(),
      options.posts.page1,
      options.posts.items.len().try_into().expect("OverflowOnThreadPostCount"),
    )
    .await?;
    for (offset, post) in options.posts.items.iter().enumerate() {
      let offset: u8 = offset.try_into().expect("OverflowOnThreadPostOffset");
      touch_hammerfest_user(&mut tx, now, &post.author.user).await?;
      touch_hammerfest_achievements(
        &mut tx,
        now,
        post.author.user.as_ref(),
        post.author.has_carrot,
        post.author.ladder_level,
      )
      .await?;
      touch_hammerfest_best_season_rank(&mut tx, now, post.author.user.as_ref(), post.author.rank).await?;
      touch_hammerfest_forum_role(&mut tx, now, post.author.user.as_ref(), post.author.role).await?;
      touch_hammerfest_forum_post(
        &mut tx,
        now,
        options.thread.as_ref(),
        options.posts.page1,
        offset,
        post.author.user.id,
        post.ctime,
        &post.content,
      )
      .await?;
      if let Some(mid) = post.id {
        session_user_is_moderator = true;
        touch_hammerfest_forum_post_id(&mut tx, now, options.thread.as_ref(), options.posts.page1, offset, mid).await?;
      }
    }
    if let Some(session_user) = response.session_user.as_ref() {
      touch_hammerfest_forum_role(
        &mut tx,
        now,
        session_user.user.as_ref(),
        if session_user_is_moderator {
          HammerfestForumRole::Moderator
        } else {
          HammerfestForumRole::None
        },
      )
      .await?;
    }

    tx.commit().await?;

    Ok(())
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyDatabase, TyUuidGenerator> neon::prelude::Finalize
  for PgHammerfestStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
}

#[cfg(test)]
mod test {
  use super::PgHammerfestStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::core::Secret;
  use etwin_core::hammerfest::HammerfestStore;
  use etwin_core::uuid::Uuid4Generator;
  use etwin_db_schema::force_create_latest;
  use serial_test::serial;
  use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
  use sqlx::PgPool;
  use std::sync::Arc;

  async fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn HammerfestStore>> {
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

    let clock = Arc::new(VirtualClock::new(Utc.ymd(2020, 1, 1).and_hms(0, 0, 0)));
    let uuid_generator = Arc::new(Uuid4Generator);
    let database_secret = Secret::new("dev_secret".to_string());
    let hammerfest_store: Arc<dyn HammerfestStore> = Arc::new(
      PgHammerfestStore::new(
        Arc::clone(&clock),
        Arc::clone(&database),
        database_secret,
        uuid_generator,
      )
      .await
      .unwrap(),
    );

    TestApi {
      clock,
      hammerfest_store,
    }
  }

  test_hammerfest_store!(
    #[serial]
    || make_test_api().await
  );

  test_hammerfest_store_pg!(
    #[serial]
    || make_test_api().await
  );
}
