use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, Secret};
use etwin_core::email::touch_email_address;
use etwin_core::hammerfest::{
  ArchivedHammerfestUser, GetHammerfestUserOptions, HammerfestForumThreadPage, HammerfestItemId, HammerfestProfile,
  HammerfestQuestId, HammerfestQuestStatus, HammerfestServer, HammerfestShop, HammerfestStore, HammerfestUserId,
  HammerfestUsername, ShortHammerfestUser,
};
use etwin_core::uuid::UuidGenerator;
use etwin_populate::hammerfest::populate_hammerfest;
use sha3::{Digest, Sha3_256};
use sqlx::postgres::PgQueryResult;
use sqlx::types::Uuid;
use sqlx::{PgPool, Postgres, Transaction};
use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::error::Error;

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
  server: HammerfestServer,
  id: HammerfestUserId,
  username: &HammerfestUsername,
  now: Instant,
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
  .bind(server)
  .bind(id)
  .bind(username.as_str())
  .bind(now)
  .execute(tx)
  .await?;
  assert_eq!(res.rows_affected(), 1);
  Ok(())
}

async fn touch_hammerfest_quest_statuses(
  tx: &mut Transaction<'_, Postgres>,
  quests: &HashMap<HammerfestQuestId, HammerfestQuestStatus>,
  map_id: impl FnOnce() -> Uuid,
) -> Result<Uuid, Box<dyn Error>> {
  let sorted: BTreeMap<HammerfestQuestId, HammerfestQuestStatus> = quests.iter().map(|(k, v)| (*k, *v)).collect();
  let hash = {
    let json = serde_json::to_string(&sorted).unwrap();
    let hash = Sha3_256::digest(json.as_bytes());
    hash
  };

  let new_id = map_id();

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
  set_id: impl FnOnce() -> Uuid,
) -> Result<Uuid, Box<dyn Error>> {
  let sorted: BTreeSet<HammerfestItemId> = items.iter().copied().collect();
  let hash = {
    let json = serde_json::to_string(&sorted).unwrap();
    let hash = Sha3_256::digest(json.as_bytes());
    hash
  };

  let new_id = set_id();

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

#[allow(clippy::too_many_arguments)]
async fn touch_hammerfest_profile(
  tx: &mut Transaction<'_, Postgres>,
  server: HammerfestServer,
  id: HammerfestUserId,
  now: Instant,
  best_score: u32,
  best_level: u8,
  season_score: u32,
  quests: Uuid,
  unlocked_items: Uuid,
) -> Result<(), Box<dyn Error>> {
  let res: PgQueryResult = sqlx::query(
    r"
    WITH
      input_row(
        hammerfest_server, hammerfest_user_id, period, retrieved_at,
        best_score, best_level,
        season_score,
        quest_statuses, unlocked_items
      ) AS (
        VALUES(
          $1::HAMMERFEST_SERVER, $2::HAMMERFEST_USER_ID, PERIOD($3::INSTANT, NULL), ARRAY[$3::INSTANT],
          $4::U32, $5::U8,
          $6::U32,
          $7::HAMMERFEST_QUEST_STATUS_MAP_ID, $8::HAMMERFEST_UNLOCKED_ITEM_SET_ID
        )
      ),
      current_row AS (
        SELECT hammerfest_server, hammerfest_user_id, period
        FROM hammerfest_profiles
        WHERE $1::HAMMERFEST_SERVER = hammerfest_server AND $2::HAMMERFEST_USER_ID = hammerfest_user_id AND upper_inf(period)
        LIMIT 1
      ),
      matching_current_row AS (
        SELECT hammerfest_server, hammerfest_user_id, period
        FROM hammerfest_profiles INNER JOIN current_row USING (hammerfest_server, hammerfest_user_id, period)
        WHERE
          $4::U32 = best_score AND $5::U8 = best_level
          AND $6::U32 = season_score
          AND $7::HAMMERFEST_QUEST_STATUS_MAP_ID = quest_statuses AND $8::HAMMERFEST_UNLOCKED_ITEM_SET_ID = unlocked_items
      ),
      missing_input_row AS (
        SELECT *
        FROM input_row
        WHERE NOT EXISTS (SELECT 1 FROM matching_current_row)
      ),
      rows_to_invalidate AS (
        SELECT * FROM current_row
        EXCEPT
        SELECT * FROM matching_current_row
      ),
      invalidated_rows AS (
        UPDATE hammerfest_profiles
          SET period = PERIOD(lower(period), $3::INSTANT)
          WHERE ROW(hammerfest_server, hammerfest_user_id, period) IN (SELECT * FROM rows_to_invalidate)
          RETURNING hammerfest_server, hammerfest_user_id, period
      ),
      updated_row AS (
        UPDATE hammerfest_profiles
        SET retrieved_at = sampled_instant_set_insert_back(retrieved_at, const_sampling_window(), $3::INSTANT)
        WHERE ROW(hammerfest_server, hammerfest_user_id, period) = (SELECT * FROM matching_current_row)
        RETURNING hammerfest_server, hammerfest_user_id, period
      ),
      inserted_row AS (
        INSERT
        INTO hammerfest_profiles(hammerfest_server, hammerfest_user_id, period, retrieved_at, best_score, best_level, season_score, quest_statuses, unlocked_items)
        SELECT * FROM missing_input_row
        RETURNING hammerfest_server, hammerfest_user_id, period
      )
    SELECT * FROM invalidated_rows
    UNION ALL
    SELECT * FROM updated_row
    UNION ALL
    SELECT * FROM inserted_row;
    ",
  )
    .bind(server)
    .bind(id)
    .bind(now)
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
  server: HammerfestServer,
  id: HammerfestUserId,
  now: Instant,
  email_hash: Option<Vec<u8>>,
) -> Result<(), Box<dyn Error>> {
  // TODO: Handle email uniqueness (insert instead of update)
  let res: PgQueryResult = sqlx::query(
    r"
    WITH
      input_row(
        hammerfest_server, hammerfest_user_id, period, retrieved_at,
        email
      ) AS (
        VALUES(
          $1::HAMMERFEST_SERVER, $2::HAMMERFEST_USER_ID, PERIOD($3::INSTANT, NULL), ARRAY[$3::INSTANT],
          $4::EMAIL_ADDRESS_HASH
        )
      ),
      current_row_email AS (
        SELECT hammerfest_server, hammerfest_user_id, period
        FROM hammerfest_emails
        WHERE $1::HAMMERFEST_SERVER = hammerfest_server AND $4::EMAIL_ADDRESS_HASH = email AND upper_inf(period)
        LIMIT 1
      ),
      current_row_uid AS (
        SELECT hammerfest_server, hammerfest_user_id, period
        FROM hammerfest_emails
        WHERE $1::HAMMERFEST_SERVER = hammerfest_server AND $2::HAMMERFEST_USER_ID = hammerfest_user_id AND upper_inf(period)
        LIMIT 1
      ),
      matching_current_row AS (
        SELECT hammerfest_server, hammerfest_user_id, period
        FROM hammerfest_emails
          INNER JOIN current_row_email USING (hammerfest_server, hammerfest_user_id, period)
          INNER JOIN current_row_uid USING (hammerfest_server, hammerfest_user_id, period)
      ),
      missing_input_row AS (
        SELECT *
        FROM input_row
        WHERE NOT EXISTS (SELECT 1 FROM matching_current_row)
      ),
      current_rows AS (
        SELECT * FROM current_row_email
        UNION
        SELECT * FROM current_row_uid
      ),
      rows_to_invalidate AS (
        SELECT * FROM current_rows
        EXCEPT
        SELECT * FROM matching_current_row
      ),
      invalidated_rows AS (
        UPDATE hammerfest_emails
          SET period = PERIOD(lower(period), $3::INSTANT)
          WHERE ROW(hammerfest_server, hammerfest_user_id, period) IN (SELECT * FROM rows_to_invalidate)
          RETURNING hammerfest_server, hammerfest_user_id, period
      ),
      updated_row AS (
        UPDATE hammerfest_emails
        SET retrieved_at = sampled_instant_set_insert_back(retrieved_at, const_sampling_window(), $3::INSTANT)
        WHERE ROW(hammerfest_server, hammerfest_user_id, period) = (SELECT * FROM matching_current_row)
        RETURNING hammerfest_server, hammerfest_user_id, period
      ),
      inserted_row AS (
        INSERT
        INTO hammerfest_emails(hammerfest_server, hammerfest_user_id, period, retrieved_at, email)
        SELECT * FROM missing_input_row
        RETURNING hammerfest_server, hammerfest_user_id, period
      )
    SELECT * FROM invalidated_rows
    UNION ALL
    SELECT * FROM updated_row
    UNION ALL
    SELECT * FROM inserted_row;
    ",
  )
  .bind(server)
  .bind(id)
  .bind(now)
  .bind(&email_hash)
  .execute(&mut *tx)
  .await.unwrap();
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (first insert), 1 invalidated (email)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  // 3 : 1 inserted (data change), 1 invalidated (primary), 1 invalidated (email)
  assert!((1..=3u64).contains(&res.rows_affected()));
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

  async fn get_user(
    &self,
    options: &GetHammerfestUserOptions,
  ) -> Result<Option<ArchivedHammerfestUser>, Box<dyn Error>> {
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

    Ok(row.map(|r| ArchivedHammerfestUser {
      server: r.hammerfest_server,
      id: r.hammerfest_user_id,
      username: r.username,
      archived_at: r.archived_at,
      profile: None,
      items: None,
    }))
  }

  async fn touch_short_user(&self, short: &ShortHammerfestUser) -> Result<ArchivedHammerfestUser, Box<dyn Error>> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    touch_hammerfest_user(&mut tx, short.server, short.id, &short.username, now).await?;

    sqlx::query(
      r"
      INSERT INTO hammerfest_users(hammerfest_server, hammerfest_user_id, username, archived_at)
      VALUES ($1::HAMMERFEST_SERVER, $2::HAMMERFEST_USER_ID, $3::HAMMERFEST_USERNAME, $4::INSTANT)
        ON CONFLICT (hammerfest_server, hammerfest_user_id)
          DO UPDATE SET username = $3::HAMMERFEST_USERNAME;
    ",
    )
    .bind(&short.server)
    .bind(&short.id)
    .bind(&short.username)
    .bind(now)
    .fetch_optional(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(ArchivedHammerfestUser {
      server: short.server,
      id: short.id,
      username: short.username.clone(),
      archived_at: now,
      profile: None,
      items: None,
    })
  }

  async fn touch_shop(&self, _options: &HammerfestShop) -> Result<(), Box<dyn Error>> {
    unimplemented!()
  }

  async fn touch_profile(&self, options: &HammerfestProfile) -> Result<(), Box<dyn Error>> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    touch_hammerfest_user(
      &mut tx,
      options.user.server,
      options.user.id,
      &options.user.username,
      now,
    )
    .await?;
    let quests = touch_hammerfest_quest_statuses(&mut tx, &options.quests, || self.uuid_generator.next()).await?;
    let unlocked_items =
      touch_hammerfest_unlocked_items(&mut tx, &options.items, || self.uuid_generator.next()).await?;
    touch_hammerfest_profile(
      &mut tx,
      options.user.server,
      options.user.id,
      now,
      options.best_score,
      options.best_level,
      options.season_score,
      quests,
      unlocked_items,
    )
    .await?;
    if let Some(email) = &options.email {
      if let Some(email) = &email {
        let email_hash = touch_email_address(&mut tx, &self.database_secret, email, now).await?;
        touch_hammerfest_email(&mut tx, options.user.server, options.user.id, now, Some(email_hash)).await?;
      } else {
        touch_hammerfest_email(&mut tx, options.user.server, options.user.id, now, None).await?;
      }
    }

    tx.commit().await?;

    Ok(())
  }

  async fn touch_inventory(&self, _options: &HashMap<HammerfestItemId, u32>) -> Result<(), Box<dyn Error>> {
    unimplemented!()
  }

  async fn touch_thread_page(&self, _options: &HammerfestForumThreadPage) -> Result<(), Box<dyn Error>> {
    unimplemented!()
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
