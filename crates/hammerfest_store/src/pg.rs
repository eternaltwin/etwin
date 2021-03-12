use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, Secret};
use etwin_core::email::touch_email_address;
use etwin_core::hammerfest::{
  hammerfest_reply_count_to_page_count, GetHammerfestUserOptions, HammerfestDate, HammerfestDateTime,
  HammerfestForumMessageId, HammerfestForumRole, HammerfestForumThemeDescription, HammerfestForumThemeId,
  HammerfestForumThemeIdRef, HammerfestForumThemePage, HammerfestForumThemeTitle, HammerfestForumThreadIdRef,
  HammerfestForumThreadKind, HammerfestForumThreadPage, HammerfestForumThreadTitle, HammerfestGodchild,
  HammerfestItemId, HammerfestLadderLevel, HammerfestProfile, HammerfestQuestId, HammerfestQuestStatus,
  HammerfestServer, HammerfestShop, HammerfestStore, HammerfestUserId, HammerfestUserIdRef, HammerfestUsername,
  ShortHammerfestUser, StoredHammerfestUser,
};
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
) -> Result<(), Box<dyn Error>> {
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
) -> Result<(), Box<dyn Error>> {
  #[allow(clippy::match_like_matches_macro)]
  let is_public = match (server, id.to_string().as_str()) {
    (HammerfestServer::HammerfestFr, "2")
    | (HammerfestServer::HammerfestFr, "3")
    | (HammerfestServer::HammerfestFr, "4") => true,
    (HammerfestServer::HammerfestEs, "2")
    | (HammerfestServer::HammerfestEs, "3")
    | (HammerfestServer::HammerfestEs, "4") => true,
    (HammerfestServer::HfestNet, "3") => true,
    _ => false,
  };
  let res: PgQueryResult = sqlx::query(
    r"
      INSERT
      INTO hammerfest_forum_themes(hammerfest_server, hammerfest_theme_id, archived_at, title, description, is_public)
      VALUES (
        $1::HAMMERFEST_SERVER, $2::HAMMERFEST_THEME_ID, $3::INSTANT, $4::HAMMERFEST_THEME_TITLE, $5::HAMMERFEST_THEME_DESCRIPTION, $6::BOOLEAN
      )
      ON CONFLICT (hammerfest_server, hammerfest_theme_id)
        DO UPDATE SET
          title = $4::HAMMERFEST_THEME_TITLE,
          description = COALESCE(EXCLUDED.description, $5::HAMMERFEST_THEME_DESCRIPTION),
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

async fn touch_hammerfest_forum_theme_page_count(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  theme: HammerfestForumThemeIdRef,
  page_count: NonZeroU16,
) -> Result<(), Box<dyn Error>> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_theme_page_counts(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_theme_id::HAMMERFEST_THEME_ID),
      data($4 page_count::U32),
    )
  ))
  .bind(now)
  .bind(theme.server)
  .bind(theme.id)
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

async fn touch_hammerfest_forum_thread(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  thread: HammerfestForumThreadIdRef,
) -> Result<(), Box<dyn Error>> {
  let res: PgQueryResult = sqlx::query(
    r"
      INSERT
      INTO hammerfest_forum_threads(hammerfest_server, hammerfest_thread_id, archived_at)
      VALUES (
        $1::HAMMERFEST_SERVER, $2::HAMMERFEST_THREAD_ID, $3::INSTANT
      )
      ON CONFLICT (hammerfest_server, hammerfest_theme_id) DO NOTHING;
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
) -> Result<(), Box<dyn Error>> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_thread_shared_meta(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_thread_id::HAMMERFEST_THREAD_ID),
      data($4 title::HAMMERFEST_FORUM_THREAD_TITLE, $5 hammerfest_theme_id::HAMMERFEST_THEME_ID, $6 is_closed::BOOLEAN, $7 page_count::U32),
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
async fn touch_hammerfest_forum_thread_list_meta(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  thread: HammerfestForumThreadIdRef,
  page: NonZeroU16,
  is_sticky: bool,
  last_message_date: Option<HammerfestDate>,
  author: HammerfestUserId,
  reply_count: u16,
) -> Result<(), Box<dyn Error>> {
  assert_eq!(is_sticky, last_message_date.is_none());
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_threads_history(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_thread_id::HAMMERFEST_THREAD_ID),
      data($4 page::U16, $5 is_sticky::BOOLEAN, $6 last_message_date::HAMMERFEST_DATE, $7 author::HAMMERFEST_USER_ID, $8 reply_count::U16),
    )
  ))
    .bind(now)
    .bind(thread.server)
    .bind(thread.id)
    .bind(i64::from(page.get()))
    .bind(is_sticky)
    .bind(last_message_date)
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
async fn touch_hammerfest_forum_message(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  thread: HammerfestForumThreadIdRef,
  page: NonZeroU16,
  offset: u8,
  author: HammerfestUserId,
  posted_at: HammerfestDateTime,
  remote_html_body: &str,
) -> Result<(), Box<dyn Error>> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_messages_history(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_thread_id::HAMMERFEST_THREAD_ID, $4 page::U16, $5 offset_in_page::U8),
      data($6 author::HAMMERFEST_USER_ID, $7 posted_at::HAMMERFEST_DATE_TIME, $8 remote_html_body::TEXT),
    )
  ))
    .bind(now)
    .bind(thread.server)
    .bind(thread.id)
    .bind(i32::from(page.get()))
    .bind(i32::from(offset))
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

async fn touch_hammerfest_forum_message_id(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  thread: HammerfestForumThreadIdRef,
  page: NonZeroU16,
  offset: u8,
  message_id: HammerfestForumMessageId,
) -> Result<(), Box<dyn Error>> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_forum_messages_history(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_thread_id::HAMMERFEST_THREAD_ID, $4 page::U16, $5 offset_in_page::U8),
      data($6 hammerfest_message_id::HAMMERFEST_FORUM_MESSAGE_ID),
      unique(mid(hammerfest_server, hammerfest_message_id)),
    )
  ))
    .bind(now)
    .bind(thread.server)
    .bind(thread.id)
    .bind(i32::from(page.get()))
    .bind(i32::from(offset))
    .bind(message_id)
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
) -> Result<Uuid, Box<dyn Error>> {
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
) -> Result<Uuid, Box<dyn Error>> {
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

async fn touch_hammerfest_items_counts(
  tx: &mut Transaction<'_, Postgres>,
  items: &HashMap<HammerfestItemId, u32>,
  new_id: Uuid,
) -> Result<Uuid, Box<dyn Error>> {
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
async fn touch_hammerfest_profile(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: HammerfestUserIdRef,
  best_score: u32,
  best_level: u8,
  season_score: u32,
  quests: Uuid,
  unlocked_items: Uuid,
) -> Result<(), Box<dyn Error>> {
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
) -> Result<(), Box<dyn Error>> {
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
) -> Result<(), Box<dyn Error>> {
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
) -> Result<(), Box<dyn Error>> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_user_ranks(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID),
      data($4 season_rank::U32?),
    )
  ))
  .bind(now)
  .bind(user.server)
  .bind(user.id)
  .bind(season_rank.map(|x| i32::try_from(x).unwrap()))
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
) -> Result<(), Box<dyn Error>> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_user_ranks(
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
  server: HammerfestServer,
  id: HammerfestUserId,
  items: Uuid,
) -> Result<(), Box<dyn Error>> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_profiles(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID),
      data($4 quest_statuses::HAMMERFEST_ITEM_COUNT_MAP_ID),
    )
  ))
  .bind(now)
  .bind(server)
  .bind(id)
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
async fn touch_hammerfest_shop_history(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: HammerfestUserIdRef,
  weekly_tokens: u8,
  purchased_tokens: Option<u8>,
  has_quest_bonus: bool,
) -> Result<(), Box<dyn Error>> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_shop_history(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID),
      data($4 weekly_tokens::U8, $5 purchased_tokens::U8?, $6 has_quest_bonus::BOOLEAN),
    )
  ))
  .bind(now)
  .bind(user.server)
  .bind(user.id)
  .bind(i32::from(weekly_tokens))
  .bind(purchased_tokens.map(i32::from))
  .bind(has_quest_bonus)
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
) -> Result<(), Box<dyn Error>> {
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
async fn touch_hammerfest_godfather(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  godchild: HammerfestUserIdRef,
  godfather: HammerfestUserIdRef,
  tokens: u32,
) -> Result<(), Box<dyn Error>> {
  assert_eq!(godchild.server, godfather.server);
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    hammerfest_godfathers(
      time($1 period, retrieved_at),
      primary($2 hammerfest_server::HAMMERFEST_SERVER, $3 hammerfest_user_id::HAMMERFEST_USER_ID),
      data($4 tokens::U32),
    )
  ))
  .bind(now)
  .bind(godchild.server)
  .bind(godchild.id)
  .bind(godfather.id)
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
  ) -> Result<Option<ShortHammerfestUser>, Box<dyn Error>> {
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

  async fn get_user(&self, options: &GetHammerfestUserOptions) -> Result<Option<StoredHammerfestUser>, Box<dyn Error>> {
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

  async fn touch_short_user(&self, user: &ShortHammerfestUser) -> Result<StoredHammerfestUser, Box<dyn Error>> {
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

  async fn touch_shop(&self, user: &ShortHammerfestUser, options: &HammerfestShop) -> Result<(), Box<dyn Error>> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    touch_hammerfest_user(&mut tx, now, user).await?;
    touch_hammerfest_shop_history(
      &mut tx,
      now,
      user.as_ref(),
      options.weekly_tokens,
      options.purchased_tokens,
      options.has_quest_bonus,
    )
    .await?;
    touch_hammerfest_tokens(&mut tx, now, user.as_ref(), options.tokens).await?;
    tx.commit().await?;
    Ok(())
  }

  async fn touch_profile(&self, options: &HammerfestProfile) -> Result<(), Box<dyn Error>> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
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

  async fn touch_inventory(
    &self,
    user: &ShortHammerfestUser,
    inventory: &HashMap<HammerfestItemId, u32>,
  ) -> Result<(), Box<dyn Error>> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    touch_hammerfest_user(&mut tx, now, user).await?;
    let items = touch_hammerfest_items_counts(&mut tx, &inventory, self.uuid_generator.next()).await?;
    touch_hammerfest_inventory(&mut tx, now, user.server, user.id, items).await?;
    tx.commit().await?;

    Ok(())
  }

  async fn touch_godchildren(
    &self,
    user: &ShortHammerfestUser,
    godchildren: &[HammerfestGodchild],
  ) -> Result<(), Box<dyn Error>> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    touch_hammerfest_user(&mut tx, now, user).await?;
    for godchild in godchildren.iter() {
      touch_hammerfest_user(&mut tx, now, &godchild.user).await?;
      touch_hammerfest_godfather(&mut tx, now, godchild.user.as_ref(), user.as_ref(), godchild.tokens).await?;
    }
    tx.commit().await?;

    Ok(())
  }

  async fn touch_theme_page(&self, options: &HammerfestForumThemePage) -> Result<(), Box<dyn Error>> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    touch_hammerfest_forum_theme(
      &mut tx,
      now,
      options.theme.server,
      options.theme.id,
      &options.theme.name,
      None,
    )
    .await?;
    touch_hammerfest_forum_theme_page_count(&mut tx, now, options.theme.as_ref(), options.threads.pages).await?;

    let page = options.threads.page1;
    for sticky in options.sticky.iter() {
      assert!(matches!(sticky.kind, HammerfestForumThreadKind::Sticky));
      touch_hammerfest_forum_thread(&mut tx, now, sticky.as_ref()).await?;
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
      touch_hammerfest_forum_thread_list_meta(
        &mut tx,
        now,
        sticky.as_ref(),
        page,
        true,
        None,
        sticky.author.id,
        sticky.reply_count,
      )
      .await?;
    }
    for thread in options.threads.items.iter() {
      let last_message_date = match thread.kind {
        HammerfestForumThreadKind::Regular { last_message_date } => last_message_date,
        _ => unreachable!(),
      };
      touch_hammerfest_forum_thread(&mut tx, now, thread.as_ref()).await?;
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
      touch_hammerfest_forum_thread_list_meta(
        &mut tx,
        now,
        thread.as_ref(),
        page,
        false,
        Some(last_message_date),
        thread.author.id,
        thread.reply_count,
      )
      .await?;
    }

    tx.commit().await?;

    Ok(())
  }

  async fn touch_thread_page(&self, options: &HammerfestForumThreadPage) -> Result<(), Box<dyn Error>> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    touch_hammerfest_forum_theme(
      &mut tx,
      now,
      options.theme.server,
      options.theme.id,
      &options.theme.name,
      None,
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
      options.messages.pages,
    )
    .await?;

    for (offset, message) in options.messages.items.iter().enumerate() {
      let offset: u8 = offset.try_into().unwrap();
      touch_hammerfest_user(&mut tx, now, &message.author.user).await?;
      touch_hammerfest_achievements(
        &mut tx,
        now,
        message.author.user.as_ref(),
        message.author.has_carrot,
        message.author.ladder_level,
      )
      .await?;
      touch_hammerfest_best_season_rank(&mut tx, now, message.author.user.as_ref(), message.author.rank).await?;
      touch_hammerfest_forum_role(&mut tx, now, message.author.user.as_ref(), message.author.role).await?;
      touch_hammerfest_forum_message(
        &mut tx,
        now,
        options.thread.as_ref(),
        options.messages.page1,
        offset,
        message.author.user.id,
        message.ctime,
        &message.content,
      )
      .await?;
      if let Some(mid) = message.id {
        touch_hammerfest_forum_message_id(
          &mut tx,
          now,
          options.thread.as_ref(),
          options.messages.page1,
          offset,
          mid,
        )
        .await?;
      }
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
