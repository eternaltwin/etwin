use async_trait::async_trait;
use etwin_core::api::ApiRef;
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, IntPercentage, PeriodLower};
use etwin_core::dinoparc::{
  ArchivedDinoparcDinoz, ArchivedDinoparcUser, DinoparcDinozElements, DinoparcDinozId, DinoparcDinozIdRef,
  DinoparcDinozName, DinoparcDinozRace, DinoparcDinozResponse, DinoparcDinozSkin, DinoparcInventoryResponse,
  DinoparcItemId, DinoparcLocationId, DinoparcServer, DinoparcSessionUser, DinoparcSkill, DinoparcSkillLevel,
  DinoparcStore, DinoparcUserId, DinoparcUserIdRef, DinoparcUsername, GetDinoparcDinozOptions, GetDinoparcUserOptions,
  ShortDinoparcUser,
};
use etwin_core::pg_num::{PgU16, PgU32};
use etwin_core::temporal::{LatestTemporal, Snapshot};
use etwin_core::types::EtwinError;
use etwin_core::uuid::UuidGenerator;
use etwin_populate::dinoparc::populate_dinoparc;
use etwin_postgres_tools::upsert_archive_query;
use sha3::{Digest, Sha3_256};
use sqlx::postgres::PgQueryResult;
use sqlx::types::Uuid;
use sqlx::{PgPool, Postgres, Transaction};
use std::collections::{BTreeMap, HashMap};
use std::convert::TryInto;
use std::error::Error;

pub struct PgDinoparcStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  clock: TyClock,
  database: TyDatabase,
  uuid_generator: TyUuidGenerator,
}

fn box_sqlx_error(e: sqlx::Error) -> Box<dyn Error + Send> {
  Box::new(e)
}

impl<TyClock, TyDatabase, TyUuidGenerator> PgDinoparcStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  pub async fn new(
    clock: TyClock,
    database: TyDatabase,
    uuid_generator: TyUuidGenerator,
  ) -> Result<Self, Box<dyn Error + Send>> {
    let mut tx = database.as_ref().begin().await.map_err(box_sqlx_error)?;
    populate_dinoparc(&mut tx).await?;
    tx.commit().await.map_err(box_sqlx_error)?;
    Ok(Self {
      clock,
      database,
      uuid_generator,
    })
  }
}

#[async_trait]
impl<TyClock, TyDatabase, TyUuidGenerator> DinoparcStore for PgDinoparcStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
  async fn touch_short_user(&self, short: &ShortDinoparcUser) -> Result<ArchivedDinoparcUser, EtwinError> {
    let now = self.clock.now();
    sqlx::query(
      r"
      INSERT INTO dinoparc_users(dinoparc_server, dinoparc_user_id, username, archived_at)
      VALUES ($1::DINOPARC_SERVER, $2::DINOPARC_USER_ID, $3::DINOPARC_USERNAME, $4::INSTANT)
        ON CONFLICT (dinoparc_server, dinoparc_user_id)
          DO UPDATE SET username = $3::DINOPARC_USERNAME;
    ",
    )
    .bind(&short.server)
    .bind(&short.id)
    .bind(&short.username)
    .bind(now)
    .fetch_optional(self.database.as_ref())
    .await?;
    Ok(ArchivedDinoparcUser {
      server: short.server,
      id: short.id,
      archived_at: now,
      username: short.username.clone(),
      coins: None,
      dinoz: None,
      inventory: None,
    })
  }

  async fn touch_inventory(&self, response: &DinoparcInventoryResponse) -> Result<(), EtwinError> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    touch_dinoparc_session_user(&mut tx, now, &response.session_user).await?;
    let inventory = &response.inventory;
    let items = touch_dinoparc_item_counts(&mut tx, inventory, self.uuid_generator.next()).await?;
    touch_dinoparc_inventory(&mut tx, now, response.session_user.user.as_ref(), items).await?;
    tx.commit().await?;

    Ok(())
  }

  async fn touch_dinoz(&self, response: &DinoparcDinozResponse) -> Result<(), EtwinError> {
    let now = self.clock.now();
    let mut tx = self.database.as_ref().begin().await?;
    touch_dinoparc_session_user(&mut tx, now, &response.session_user).await?;
    let dinoz = &response.dinoz;
    touch_dinoparc_dinoz(&mut tx, now, dinoz.as_ref()).await?;
    // touch_dinoparc_dinoz_owner(tx, now, dinoz.as_ref(), user).await?;
    touch_dinoparc_dinoz_name(&mut tx, now, dinoz.as_ref(), &dinoz.name).await?;
    touch_dinoparc_dinoz_location(&mut tx, now, dinoz.as_ref(), dinoz.location).await?;
    touch_dinoparc_dinoz_level(&mut tx, now, dinoz.as_ref(), dinoz.level).await?;
    let skills = touch_dinoparc_skill_levels(&mut tx, &dinoz.skills, self.uuid_generator.next()).await?;
    touch_dinoparc_dinoz_profile(
      &mut tx,
      now,
      dinoz.as_ref(),
      dinoz.race,
      &dinoz.skin,
      dinoz.life,
      dinoz.experience,
      dinoz.danger,
      dinoz.in_tournament,
      dinoz.elements,
      skills,
    )
    .await?;
    tx.commit().await?;

    Ok(())
  }

  async fn get_dinoz(&self, options: &GetDinoparcDinozOptions) -> Result<Option<ArchivedDinoparcDinoz>, EtwinError> {
    let time = options.time.unwrap_or_else(|| self.clock.now());
    let mut tx = self.database.as_ref().begin().await?;

    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      dinoparc_server: DinoparcServer,
      dinoparc_dinoz_id: DinoparcDinozId,
      archived_at: Instant,
      name_period: Option<PeriodLower>,
      name_value: Option<DinoparcDinozName>,
      location_period: Option<PeriodLower>,
      location_value: Option<DinoparcLocationId>,
      level_period: Option<PeriodLower>,
      level_value: Option<PgU16>,
      profile_period: Option<PeriodLower>,
      profile_race: Option<DinoparcDinozRace>,
      profile_skin: Option<DinoparcDinozSkin>,
      profile_life: Option<IntPercentage>,
      profile_experience: Option<IntPercentage>,
      profile_danger: Option<i16>,
      profile_in_tournament: Option<bool>,
      profile_elements: Option<DinoparcDinozElements>,
      profile_skills: Option<Uuid>,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
      WITH latest_dinoparc_dinoz_names AS (
        SELECT dinoparc_server, dinoparc_dinoz_id,
          LAST_VALUE(period) OVER w AS period,
          LAST_VALUE(name) OVER w AS name
        FROM dinoparc_dinoz_names
        WHERE lower(period) <= $3::INSTANT
        WINDOW w AS (PARTITION BY (dinoparc_server, dinoparc_dinoz_id) ORDER BY lower(period) ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
      ),
      latest_dinoparc_dinoz_locations AS (
        SELECT dinoparc_server, dinoparc_dinoz_id,
          LAST_VALUE(period) OVER w AS period,
          LAST_VALUE(location) OVER w AS location
        FROM dinoparc_dinoz_locations
        WHERE lower(period) <= $3::INSTANT
        WINDOW w AS (PARTITION BY (dinoparc_server, dinoparc_dinoz_id) ORDER BY lower(period) ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
      ),
      latest_dinoparc_dinoz_levels AS (
        SELECT dinoparc_server, dinoparc_dinoz_id,
          LAST_VALUE(period) OVER w AS period,
          LAST_VALUE(level) OVER w AS level
        FROM dinoparc_dinoz_levels
        WHERE lower(period) <= $3::INSTANT
        WINDOW w AS (PARTITION BY (dinoparc_server, dinoparc_dinoz_id) ORDER BY lower(period) ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
      ),
      latest_dinoparc_dinoz_profiles AS (
        SELECT dinoparc_server, dinoparc_dinoz_id,
          LAST_VALUE(period) OVER w AS period,
          LAST_VALUE(race) OVER w AS race,
          LAST_VALUE(skin) OVER w AS skin,
          LAST_VALUE(life) OVER w AS life,
          LAST_VALUE(experience) OVER w AS experience,
          LAST_VALUE(danger) OVER w AS danger,
          LAST_VALUE(in_tournament) OVER w AS in_tournament,
          LAST_VALUE(elements) OVER w AS elements,
          LAST_VALUE(skills) OVER w AS skills
        FROM dinoparc_dinoz_profiles
        WHERE lower(period) <= $3::INSTANT
        WINDOW w AS (PARTITION BY (dinoparc_server, dinoparc_dinoz_id) ORDER BY lower(period) ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
      )
      SELECT dinoparc_server, dinoparc_dinoz_id, archived_at,
        name.period AS name_period, name.name AS name_value,
        location.period AS location_period, location.location AS location_value,
        level.period AS level_period, level.level AS level_value,
        profile.period AS profile_period,
        profile.race AS profile_race, profile.skin AS profile_skin,
        profile.life AS profile_life, profile.experience AS profile_experience,
        profile.danger AS profile_danger, profile.in_tournament AS profile_in_tournament,
        profile.elements AS profile_elements, profile.skills AS profile_skills
      FROM dinoparc_dinoz
        LEFT OUTER JOIN latest_dinoparc_dinoz_names AS name USING (dinoparc_server, dinoparc_dinoz_id)
        LEFT OUTER JOIN latest_dinoparc_dinoz_locations AS location USING (dinoparc_server, dinoparc_dinoz_id)
        LEFT OUTER JOIN latest_dinoparc_dinoz_levels AS level USING (dinoparc_server, dinoparc_dinoz_id)
        LEFT OUTER JOIN latest_dinoparc_dinoz_profiles AS profile USING (dinoparc_server, dinoparc_dinoz_id)
      WHERE dinoparc_server = $1::DINOPARC_SERVER AND dinoparc_dinoz_id = $2::DINOPARC_DINOZ_ID AND archived_at <= $3::INSTANT;
    ",
    )
      .bind(&options.server)
      .bind(&options.id)
      .bind(time)
      .fetch_optional(&mut tx)
      .await?;

    let row = match row {
      Some(row) => row,
      None => return Ok(None),
    };

    let skills = if let Some(skills) = row.profile_skills {
      #[derive(Debug, sqlx::FromRow)]
      struct Row {
        dinoparc_skill: DinoparcSkill,
        level: DinoparcSkillLevel,
      }

      let rows: Vec<Row> = sqlx::query_as::<_, Row>(
        r"
      SELECT dinoparc_skill, level
      FROM dinoparc_skill_level_map_items
      WHERE dinoparc_skill_level_map_id = $1::DINOPARC_SKILL_LEVEL_MAP_ID;
    ",
      )
      .bind(skills)
      .fetch_all(&mut tx)
      .await?;

      let skills: HashMap<DinoparcSkill, DinoparcSkillLevel> =
        rows.iter().map(|r| (r.dinoparc_skill, r.level)).collect();
      Some(skills)
    } else {
      None
    };

    Ok(Some(ArchivedDinoparcDinoz {
      server: row.dinoparc_server,
      id: row.dinoparc_dinoz_id,
      archived_at: row.archived_at,
      name: to_latest_temporal(row.name_period, row.name_value),
      location: to_latest_temporal(row.location_period, row.location_value),
      race: to_latest_temporal(row.profile_period, row.profile_race),
      skin: to_latest_temporal(row.profile_period, row.profile_skin),
      life: to_latest_temporal(row.profile_period, row.profile_life),
      level: to_latest_temporal(row.level_period, row.level_value).map(|t| t.map(u16::from)),
      experience: to_latest_temporal(row.profile_period, row.profile_experience),
      danger: to_latest_temporal(row.level_period, row.profile_danger),
      in_tournament: to_latest_temporal(row.profile_period, row.profile_in_tournament),
      elements: to_latest_temporal(row.profile_period, row.profile_elements),
      skills: to_latest_temporal(row.profile_period, skills),
    }))
  }

  async fn get_user(&self, options: &GetDinoparcUserOptions) -> Result<Option<ArchivedDinoparcUser>, EtwinError> {
    let time = options.time.unwrap_or_else(|| self.clock.now());
    let mut tx = self.database.as_ref().begin().await?;

    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      dinoparc_server: DinoparcServer,
      dinoparc_user_id: DinoparcUserId,
      archived_at: Instant,
      username: DinoparcUsername,
      coins_period: Option<PeriodLower>,
      coins_value: Option<PgU32>,
      inventory_period: Option<PeriodLower>,
      inventory_value: Option<Uuid>,
      dinoz_count_period: Option<PeriodLower>,
      dinoz_count_value: Option<PgU32>,
    }

    let row: Option<Row> = sqlx::query_as::<_, Row>(
      r"
      WITH latest_dinoparc_coins AS (
        SELECT dinoparc_server, dinoparc_user_id,
          LAST_VALUE(period) OVER w AS period,
          LAST_VALUE(coins) OVER w AS coins
        FROM dinoparc_coins
        WHERE lower(period) <= $3::INSTANT
        WINDOW w AS (PARTITION BY (dinoparc_server, dinoparc_user_id) ORDER BY lower(period) ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
      ),
      latest_dinoparc_inventories AS (
        SELECT dinoparc_server, dinoparc_user_id,
          LAST_VALUE(period) OVER w AS period,
          LAST_VALUE(item_counts) OVER w AS item_counts
        FROM dinoparc_inventories
        WHERE lower(period) <= $3::INSTANT
        WINDOW w AS (PARTITION BY (dinoparc_server, dinoparc_user_id) ORDER BY lower(period) ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
      ),
      latest_dinoparc_user_dinoz_counts AS (
        SELECT dinoparc_server, dinoparc_user_id,
          LAST_VALUE(period) OVER w AS period,
          LAST_VALUE(dinoz_count) OVER w AS dinoz_count
        FROM dinoparc_user_dinoz_counts
        WHERE lower(period) <= $3::INSTANT
        WINDOW w AS (PARTITION BY (dinoparc_server, dinoparc_user_id) ORDER BY lower(period) ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
      )
      SELECT dinoparc_server, dinoparc_user_id, archived_at, username,
        coins.period AS coins_period, coins.coins AS coins_value,
        inventory.period AS inventory_period, inventory.item_counts AS inventory_value,
        dinoz_count.period AS dinoz_count_period, dinoz_count.dinoz_count AS dinoz_count_value
      FROM dinoparc_users
        LEFT OUTER JOIN latest_dinoparc_coins AS coins USING (dinoparc_server, dinoparc_user_id)
        LEFT OUTER JOIN latest_dinoparc_inventories AS inventory USING (dinoparc_server, dinoparc_user_id)
        LEFT OUTER JOIN latest_dinoparc_user_dinoz_counts AS dinoz_count USING (dinoparc_server, dinoparc_user_id)
      WHERE dinoparc_server = $1::DINOPARC_SERVER AND dinoparc_user_id = $2::DINOPARC_USER_ID AND archived_at <= $3::INSTANT;
    ",
    )
      .bind(&options.server)
      .bind(&options.id)
      .bind(time)
      .fetch_optional(&mut tx)
      .await?;

    let row = match row {
      Some(row) => row,
      None => return Ok(None),
    };

    let inventory = if let Some(inventory) = row.inventory_value {
      #[derive(Debug, sqlx::FromRow)]
      struct Row {
        dinoparc_item_id: DinoparcItemId,
        count: PgU32,
      }

      let rows: Vec<Row> = sqlx::query_as::<_, Row>(
        r"
      SELECT dinoparc_item_id, count
      FROM dinoparc_item_count_map_items
      WHERE dinoparc_item_count_map_id = $1::DINOPARC_ITEM_COUNT_MAP_ID;
    ",
      )
      .bind(inventory)
      .fetch_all(&mut tx)
      .await?;

      let inventory: HashMap<DinoparcItemId, u32> = rows.iter().map(|r| (r.dinoparc_item_id, r.count.into())).collect();
      Some(inventory)
    } else {
      None
    };

    let dinoz = match (row.dinoz_count_period, row.dinoz_count_value) {
      (Some(period), Some(dinoz_count)) => {
        #[derive(Debug, sqlx::FromRow)]
        struct Row {
          dinoparc_dinoz_id: DinoparcDinozId,
        }

        let rows: Vec<Row> = sqlx::query_as::<_, Row>(
              r"
          SELECT LAST_VALUE(dinoparc_dinoz_id) OVER w AS dinoparc_dinoz_id
          FROM dinoparc_user_dinoz
          WHERE dinoparc_server = $1::DINOPARC_SERVER AND dinoparc_user_id = $2::DINOPARC_USER_ID AND lower(period) <= $3::INSTANT AND offset_in_list < $4::U32
          WINDOW w AS (PARTITION BY (dinoparc_server, dinoparc_user_id, offset_in_list) ORDER BY lower(period) ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
          ORDER BY offset_in_list;
        ",
        )
          .bind(options.server)
          .bind(options.id)
          .bind(time)
          .bind(dinoz_count)
          .fetch_all(&mut tx)
          .await?;

        let dinoz: Vec<DinoparcDinozIdRef> = rows
          .into_iter()
          .map(|r| DinoparcDinozIdRef {
            server: options.server,
            id: r.dinoparc_dinoz_id,
          })
          .collect();

        Some(LatestTemporal {
          latest: Snapshot { period, value: dinoz },
        })
      }
      (None, None) => None,
      _ => unreachable!(),
    };

    Ok(Some(ArchivedDinoparcUser {
      server: row.dinoparc_server,
      id: row.dinoparc_user_id,
      archived_at: row.archived_at,
      username: row.username,
      coins: to_latest_temporal(row.coins_period, row.coins_value).map(|t| t.map(u32::from)),
      inventory: to_latest_temporal(row.inventory_period, inventory),
      dinoz,
    }))
  }
}

fn to_latest_temporal<T>(period: Option<PeriodLower>, value: Option<T>) -> Option<LatestTemporal<T>> {
  match (period, value) {
    (Some(period), Some(value)) => Some(LatestTemporal {
      latest: Snapshot { period, value },
    }),
    (None, None) => None,
    _ => unreachable!(),
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyDatabase, TyUuidGenerator> neon::prelude::Finalize
  for PgDinoparcStore<TyClock, TyDatabase, TyUuidGenerator>
where
  TyClock: Clock,
  TyDatabase: ApiRef<PgPool>,
  TyUuidGenerator: UuidGenerator,
{
}

#[allow(clippy::too_many_arguments)]
async fn touch_dinoparc_session_user(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  session_user: &DinoparcSessionUser,
) -> Result<(), EtwinError> {
  touch_dinoparc_user(tx, now, &session_user.user).await?;
  let user = session_user.user.as_ref();
  touch_dinoparc_coins(tx, now, user, session_user.coins).await?;
  touch_dinoparc_user_dinoz_count(
    tx,
    now,
    user,
    session_user.dinoz.len().try_into().expect("OverflowOnUserDinozCount"),
  )
  .await?;
  for (offset, dinoz) in session_user.dinoz.iter().enumerate() {
    touch_dinoparc_dinoz(tx, now, dinoz.as_ref()).await?;
    touch_dinoparc_user_dinoz_item(
      tx,
      now,
      user,
      offset.try_into().expect("OverflowOnUserDinozOffset"),
      dinoz.as_ref(),
    )
    .await?;
    touch_dinoparc_dinoz_owner(tx, now, dinoz.as_ref(), user).await?;
    touch_dinoparc_dinoz_name(tx, now, dinoz.as_ref(), &dinoz.name).await?;
    touch_dinoparc_dinoz_location(tx, now, dinoz.as_ref(), dinoz.location).await?;
  }
  Ok(())
}

async fn touch_dinoparc_user(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: &ShortDinoparcUser,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(
    r"
      INSERT
      INTO dinoparc_users(dinoparc_server, dinoparc_user_id, username, archived_at)
      VALUES (
        $1::DINOPARC_SERVER, $2::DINOPARC_USER_ID, $3::DINOPARC_USERNAME, $4::INSTANT
      )
      ON CONFLICT (dinoparc_server, dinoparc_user_id) DO UPDATE SET username = $3::DINOPARC_USERNAME;
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

async fn touch_dinoparc_dinoz(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  dinoz: DinoparcDinozIdRef,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(
    r"
      INSERT
      INTO dinoparc_dinoz(dinoparc_server, dinoparc_dinoz_id, archived_at)
      VALUES (
        $1::DINOPARC_SERVER, $2::DINOPARC_DINOZ_ID, $3::INSTANT
      )
      ON CONFLICT (dinoparc_server, dinoparc_dinoz_id) DO NOTHING;
      ",
  )
  .bind(dinoz.server)
  .bind(dinoz.id)
  .bind(now)
  .execute(tx)
  .await?;
  assert!((0..=1u64).contains(&res.rows_affected()));
  Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn touch_dinoparc_coins(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: DinoparcUserIdRef,
  coins: u32,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    dinoparc_coins(
      time($1 period, retrieved_at),
      primary($2 dinoparc_server::DINOPARC_SERVER, $3 dinoparc_user_id::DINOPARC_USER_ID),
      data($4 coins::U32),
    )
  ))
  .bind(now)
  .bind(user.server)
  .bind(user.id)
  .bind(PgU32::from(coins))
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
async fn touch_dinoparc_inventory(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: DinoparcUserIdRef,
  items: Uuid,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    dinoparc_inventories(
      time($1 period, retrieved_at),
      primary($2 dinoparc_server::DINOPARC_SERVER, $3 dinoparc_user_id::DINOPARC_USER_ID),
      data($4 item_counts::DINOPARC_ITEM_COUNT_MAP_ID),
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
async fn touch_dinoparc_dinoz_name(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  dinoz: DinoparcDinozIdRef,
  name: &DinoparcDinozName,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    dinoparc_dinoz_names(
      time($1 period, retrieved_at),
      primary($2 dinoparc_server::DINOPARC_SERVER, $3 dinoparc_dinoz_id::DINOPARC_DINOZ_ID),
      data($4 name::DINOPARC_DINOZ_NAME),
    )
  ))
  .bind(now)
  .bind(dinoz.server)
  .bind(dinoz.id)
  .bind(name)
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
async fn touch_dinoparc_dinoz_owner(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  dinoz: DinoparcDinozIdRef,
  owner: DinoparcUserIdRef,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    dinoparc_dinoz_owners(
      time($1 period, retrieved_at),
      primary($2 dinoparc_server::DINOPARC_SERVER, $3 dinoparc_dinoz_id::DINOPARC_DINOZ_ID),
      data($4 owner::DINOPARC_USER_ID),
    )
  ))
  .bind(now)
  .bind(dinoz.server)
  .bind(dinoz.id)
  .bind(owner.id)
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
async fn touch_dinoparc_dinoz_location(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  dinoz: DinoparcDinozIdRef,
  location: DinoparcLocationId,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    dinoparc_dinoz_locations(
      time($1 period, retrieved_at),
      primary($2 dinoparc_server::DINOPARC_SERVER, $3 dinoparc_dinoz_id::DINOPARC_DINOZ_ID),
      data($4 location::DINOPARC_LOCATION_ID),
    )
  ))
  .bind(now)
  .bind(dinoz.server)
  .bind(dinoz.id)
  .bind(location)
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
async fn touch_dinoparc_dinoz_level(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  dinoz: DinoparcDinozIdRef,
  level: u16,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    dinoparc_dinoz_levels(
      time($1 period, retrieved_at),
      primary($2 dinoparc_server::DINOPARC_SERVER, $3 dinoparc_dinoz_id::DINOPARC_DINOZ_ID),
      data($4 level::U16),
    )
  ))
  .bind(now)
  .bind(dinoz.server)
  .bind(dinoz.id)
  .bind(i32::from(level))
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
async fn touch_dinoparc_dinoz_profile(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  dinoz: DinoparcDinozIdRef,
  race: DinoparcDinozRace,
  skin: &DinoparcDinozSkin,
  life: IntPercentage,
  experience: IntPercentage,
  danger: i16,
  in_tournameent: bool,
  elements: DinoparcDinozElements,
  skills: Uuid,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    dinoparc_dinoz_profiles(
      time($1 period, retrieved_at),
      primary($2 dinoparc_server::DINOPARC_SERVER, $3 dinoparc_dinoz_id::DINOPARC_DINOZ_ID),
      data(
        $4 race::DINOPARC_DINOZ_RACE, $5 skin::DINOPARC_DINOZ_SKIN,
        $6 life::INT_PERCENTAGE, $7 experience::INT_PERCENTAGE, $8 danger::I16,
        $9 in_tournament::BOOLEAN, $10 elements::DINOPARC_DINOZ_ELEMENTS,
        $11 skills::dinoparc_skill_level_map_id
      ),
    )
  ))
  .bind(now)
  .bind(dinoz.server)
  .bind(dinoz.id)
  .bind(race)
  .bind(skin)
  .bind(life)
  .bind(experience)
  .bind(danger)
  .bind(in_tournameent)
  .bind(elements)
  .bind(skills)
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

async fn touch_dinoparc_user_dinoz_count(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: DinoparcUserIdRef,
  dinoz_count: u32,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    dinoparc_user_dinoz_counts(
      time($1 period, retrieved_at),
      primary($2 dinoparc_server::DINOPARC_SERVER, $3 dinoparc_user_id::DINOPARC_USER_ID),
      data($4 dinoz_count::U32),
    )
  ))
  .bind(now)
  .bind(user.server)
  .bind(user.id)
  .bind(PgU32::from(dinoz_count))
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary)
  assert!((1..=2u64).contains(&res.rows_affected()));
  Ok(())
}

async fn touch_dinoparc_user_dinoz_item(
  tx: &mut Transaction<'_, Postgres>,
  now: Instant,
  user: DinoparcUserIdRef,
  offset: u32,
  dinoz: DinoparcDinozIdRef,
) -> Result<(), EtwinError> {
  let res: PgQueryResult = sqlx::query(upsert_archive_query!(
    dinoparc_user_dinoz(
      time($1 period, retrieved_at),
      primary($2 dinoparc_server::DINOPARC_SERVER, $3 dinoparc_user_id::DINOPARC_USER_ID, $4 offset_in_list::U32),
      data($5 dinoparc_dinoz_id::DINOPARC_DINOZ_ID),
    )
  ))
  .bind(now)
  .bind(user.server)
  .bind(user.id)
  .bind(PgU32::from(offset))
  .bind(dinoz.id)
  .execute(&mut *tx)
  .await?;
  // Affected row counts:
  // 1 : 1 updated (matching data)
  // 1 : 1 inserted (first insert)
  // 2 : 1 inserted (data change), 1 invalidated (primary + dinoz_id)
  assert!((1..=3u64).contains(&res.rows_affected()));
  Ok(())
}

async fn touch_dinoparc_item_counts(
  tx: &mut Transaction<'_, Postgres>,
  items: &HashMap<DinoparcItemId, u32>,
  new_id: Uuid,
) -> Result<Uuid, EtwinError> {
  let sorted: BTreeMap<DinoparcItemId, u32> = items.iter().map(|(k, v)| (*k, *v)).collect();
  let hash = {
    let json = serde_json::to_string(&sorted).unwrap();
    let hash = Sha3_256::digest(json.as_bytes());
    hash
  };

  let map_id = {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      dinoparc_item_count_map_id: Uuid,
    }
    let row: Row = sqlx::query_as::<_, Row>(
      r"
      WITH
        input_row(dinoparc_item_count_map_id, _sha3_256) AS (
          VALUES($1::DINOPARC_ITEM_COUNT_MAP_ID, $2::BYTEA)
        ),
        inserted_rows AS (
          INSERT
          INTO dinoparc_item_count_maps(dinoparc_item_count_map_id, _sha3_256)
          SELECT * FROM input_row
          ON CONFLICT DO NOTHING
          RETURNING dinoparc_item_count_map_id
        )
      SELECT dinoparc_item_count_map_id FROM inserted_rows
      UNION ALL
      SELECT old.dinoparc_item_count_map_id FROM dinoparc_item_count_maps AS old INNER JOIN input_row USING(_sha3_256);
      ",
    )
    .bind(new_id)
    .bind(hash.as_slice())
    .fetch_one(&mut *tx)
    .await?;

    row.dinoparc_item_count_map_id
  };

  if map_id == new_id {
    // Newly created map: fill its content
    for (id, count) in sorted.iter() {
      let res: PgQueryResult = sqlx::query(
        r"
        INSERT
        INTO dinoparc_item_count_map_items(dinoparc_item_count_map_id, dinoparc_item_id, count)
        VALUES ($1::DINOPARC_ITEM_COUNT_MAP_ID, $2::DINOPARC_ITEM_ID, $3::U32);
      ",
      )
      .bind(map_id)
      .bind(id)
      .bind(PgU32::from(*count))
      .execute(&mut *tx)
      .await?;
      assert_eq!(res.rows_affected(), 1);
    }
  } else {
    // Re-using old id, check for hash collision
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      dinoparc_item_id: DinoparcItemId,
      count: PgU32,
    }

    let rows: Vec<Row> = sqlx::query_as::<_, Row>(
      r"
      SELECT dinoparc_item_id, count
      FROM dinoparc_item_count_map_items
      WHERE dinoparc_item_count_map_id = $1::DINOPARC_ITEM_COUNT_MAP_ID;
    ",
    )
    .bind(map_id)
    .fetch_all(&mut *tx)
    .await?;

    let actual: BTreeMap<DinoparcItemId, u32> = rows.iter().map(|r| (r.dinoparc_item_id, r.count.into())).collect();

    assert_eq!(actual, sorted);
  }

  Ok(map_id)
}

async fn touch_dinoparc_skill_levels(
  tx: &mut Transaction<'_, Postgres>,
  skills: &HashMap<DinoparcSkill, DinoparcSkillLevel>,
  new_id: Uuid,
) -> Result<Uuid, EtwinError> {
  let sorted: BTreeMap<DinoparcSkill, DinoparcSkillLevel> = skills.iter().map(|(k, v)| (*k, *v)).collect();
  let hash = {
    let json = serde_json::to_string(&sorted).unwrap();
    let hash = Sha3_256::digest(json.as_bytes());
    hash
  };

  let map_id = {
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      dinoparc_skill_level_map_id: Uuid,
    }
    let row: Row = sqlx::query_as::<_, Row>(
      r"
      WITH
        input_row(dinoparc_skill_level_map_id, _sha3_256) AS (
          VALUES($1::DINOPARC_SKILL_LEVEL_MAP_ID, $2::BYTEA)
        ),
        inserted_rows AS (
          INSERT
          INTO dinoparc_skill_level_maps(dinoparc_skill_level_map_id, _sha3_256)
          SELECT * FROM input_row
          ON CONFLICT DO NOTHING
          RETURNING dinoparc_skill_level_map_id
        )
      SELECT dinoparc_skill_level_map_id FROM inserted_rows
      UNION ALL
      SELECT old.dinoparc_skill_level_map_id FROM dinoparc_skill_level_maps AS old INNER JOIN input_row USING(_sha3_256);
      ",
    )
    .bind(new_id)
    .bind(hash.as_slice())
    .fetch_one(&mut *tx)
    .await?;

    row.dinoparc_skill_level_map_id
  };

  if map_id == new_id {
    // Newly created map: fill its content
    for (skill, level) in sorted.iter() {
      let res: PgQueryResult = sqlx::query(
        r"
        INSERT
        INTO dinoparc_skill_level_map_items(dinoparc_skill_level_map_id, dinoparc_skill, level)
        VALUES ($1::DINOPARC_SKILL_LEVEL_MAP_ID, $2::DINOPARC_SKILL, $3::DINOPARC_SKILL_LEVEL);
      ",
      )
      .bind(map_id)
      .bind(skill)
      .bind(*level)
      .execute(&mut *tx)
      .await?;
      assert_eq!(res.rows_affected(), 1);
    }
  } else {
    // Re-using old id, check for hash collision
    #[derive(Debug, sqlx::FromRow)]
    struct Row {
      dinoparc_skill: DinoparcSkill,
      level: DinoparcSkillLevel,
    }

    let rows: Vec<Row> = sqlx::query_as::<_, Row>(
      r"
      SELECT dinoparc_skill, level
      FROM dinoparc_skill_level_map_items
      WHERE dinoparc_skill_level_map_id = $1::DINOPARC_SKILL_LEVEL_MAP_ID;
    ",
    )
    .bind(map_id)
    .fetch_all(&mut *tx)
    .await?;

    let actual: BTreeMap<DinoparcSkill, DinoparcSkillLevel> =
      rows.iter().map(|r| (r.dinoparc_skill, r.level)).collect();

    assert_eq!(actual, sorted);
  }

  Ok(map_id)
}

#[cfg(test)]
mod test {
  use super::PgDinoparcStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::dinoparc::DinoparcStore;
  use etwin_core::uuid::Uuid4Generator;
  use etwin_db_schema::force_create_latest;
  use serial_test::serial;
  use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
  use sqlx::PgPool;
  use std::sync::Arc;

  async fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn DinoparcStore>> {
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
    let uuid_generator = Arc::new(Uuid4Generator);
    let dinoparc_store: Arc<dyn DinoparcStore> = Arc::new(
      PgDinoparcStore::new(Arc::clone(&clock), Arc::clone(&database), uuid_generator)
        .await
        .unwrap(),
    );

    TestApi { clock, dinoparc_store }
  }

  test_dinoparc_store!(
    #[serial]
    || make_test_api().await
  );

  test_dinoparc_store_pg!(
    #[serial]
    || make_test_api().await
  );
}
