use etwin_constants::hammerfest::{ITEMS, ITEMS_BY_ID, QUESTS};
use etwin_core::hammerfest::{HammerfestItemId, HammerfestQuestId, HammerfestServer};
use sqlx::postgres::PgQueryResult;
use sqlx::{Postgres, Transaction};
use std::collections::BTreeSet;
use std::error::Error;

fn box_sqlx_error(e: sqlx::Error) -> Box<dyn Error + Send> {
  Box::new(e)
}

pub async fn populate_hammerfest(tx: &mut Transaction<'_, Postgres>) -> Result<(), Box<dyn Error + Send>> {
  populate_hammerfest_servers(tx).await?;
  populate_hammerfest_quests(tx).await?;
  populate_hammerfest_items(tx).await?;
  Ok(())
}

async fn populate_hammerfest_servers(tx: &mut Transaction<'_, Postgres>) -> Result<(), Box<dyn Error + Send>> {
  #[derive(Debug, sqlx::FromRow)]
  struct Row {
    hammerfest_server: HammerfestServer,
  }

  let rows: Vec<Row> = sqlx::query_as::<_, Row>(
    r"
      SELECT hammerfest_server
      FROM hammerfest_servers;
    ",
  )
  .fetch_all(&mut *tx)
  .await
  .map_err(box_sqlx_error)?;

  let actual: BTreeSet<_> = rows.iter().map(|r| r.hammerfest_server).collect();
  let expected: BTreeSet<_> = HammerfestServer::iter().collect();

  if actual == expected {
    return Ok(());
  }

  for extra in actual.difference(&expected) {
    let res: PgQueryResult = sqlx::query(
      r"
      DELETE
      FROM hammerfest_servers
      WHERE hammerfest_server = $1::hammerfest_server;
    ",
    )
    .bind(extra)
    .execute(&mut *tx)
    .await
    .map_err(box_sqlx_error)?;
    assert_eq!(res.rows_affected(), 1);
  }

  for value in expected {
    let res: PgQueryResult = sqlx::query(
      r"
      INSERT
      INTO hammerfest_servers(hammerfest_server)
      VALUES ($1::hammerfest_server)
      ON CONFLICT (hammerfest_server) DO NOTHING;
    ",
    )
    .bind(value)
    .execute(&mut *tx)
    .await
    .map_err(box_sqlx_error)?;
    assert!((0..=1u64).contains(&res.rows_affected()));
  }

  Ok(())
}

async fn populate_hammerfest_items(tx: &mut Transaction<'_, Postgres>) -> Result<(), Box<dyn Error + Send>> {
  #[derive(Debug, sqlx::FromRow)]
  struct Row {
    hammerfest_item_id: HammerfestItemId,
  }

  let rows: Vec<Row> = sqlx::query_as::<_, Row>(
    r"
      SELECT hammerfest_item_id
      FROM hammerfest_items;
    ",
  )
  .fetch_all(&mut *tx)
  .await
  .map_err(box_sqlx_error)?;

  let actual: BTreeSet<HammerfestItemId> = rows.iter().map(|r| r.hammerfest_item_id).collect();
  let expected: BTreeSet<HammerfestItemId> = ITEMS.iter().map(|q| q.id).collect();

  for extra_qid in actual.difference(&expected) {
    let res: PgQueryResult = sqlx::query(
      r"
      DELETE
      FROM hammerfest_items
      WHERE hammerfest_item_id = $1::hammerfest_item_id;
    ",
    )
    .bind(extra_qid)
    .execute(&mut *tx)
    .await
    .map_err(box_sqlx_error)?;
    assert_eq!(res.rows_affected(), 1);
  }

  let items_by_id = &*ITEMS_BY_ID;
  for iid in expected {
    let item = *items_by_id.get(&iid).unwrap();
    let res: PgQueryResult = sqlx::query(
      r"
      INSERT
      INTO hammerfest_items(hammerfest_item_id, is_hidden)
      VALUES ($1::hammerfest_item_id, $2::BOOLEAN)
      ON CONFLICT (hammerfest_item_id) DO UPDATE SET is_hidden = $2::BOOLEAN;
    ",
    )
    .bind(item.id)
    .bind(item.is_hidden)
    .execute(&mut *tx)
    .await
    .map_err(box_sqlx_error)?;
    assert_eq!(res.rows_affected(), 1);
  }

  Ok(())
}

async fn populate_hammerfest_quests(tx: &mut Transaction<'_, Postgres>) -> Result<(), Box<dyn Error + Send>> {
  #[derive(Debug, sqlx::FromRow)]
  struct Row {
    hammerfest_quest_id: HammerfestQuestId,
  }

  let rows: Vec<Row> = sqlx::query_as::<_, Row>(
    r"
      SELECT hammerfest_quest_id
      FROM hammerfest_quests;
    ",
  )
  .fetch_all(&mut *tx)
  .await
  .map_err(box_sqlx_error)?;

  let actual: BTreeSet<HammerfestQuestId> = rows.iter().map(|r| r.hammerfest_quest_id).collect();
  let expected: BTreeSet<HammerfestQuestId> = QUESTS.iter().map(|q| q.id).collect();

  if actual == expected {
    return Ok(());
  }

  for extra_qid in actual.difference(&expected) {
    let res: PgQueryResult = sqlx::query(
      r"
      DELETE
      FROM hammerfest_quests
      WHERE hammerfest_quest_id = $1::hammerfest_quest_id;
    ",
    )
    .bind(extra_qid)
    .execute(&mut *tx)
    .await
    .map_err(box_sqlx_error)?;
    assert_eq!(res.rows_affected(), 1);
  }

  for qid in expected {
    let res: PgQueryResult = sqlx::query(
      r"
      INSERT
      INTO hammerfest_quests(hammerfest_quest_id)
      VALUES ($1::hammerfest_quest_id)
      ON CONFLICT (hammerfest_quest_id) DO NOTHING;
    ",
    )
    .bind(qid)
    .execute(&mut *tx)
    .await
    .map_err(box_sqlx_error)?;
    assert!((0..=1u64).contains(&res.rows_affected()));
  }

  Ok(())
}
