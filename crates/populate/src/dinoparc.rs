use etwin_core::dinoparc::DinoparcServer;
use sqlx::postgres::PgQueryResult;
use sqlx::{Postgres, Transaction};
use std::collections::BTreeSet;
use std::error::Error;

fn box_sqlx_error(e: sqlx::Error) -> Box<dyn Error + Send> {
  Box::new(e)
}

pub async fn populate_dinoparc(tx: &mut Transaction<'_, Postgres>) -> Result<(), Box<dyn Error + Send>> {
  populate_dinoparc_servers(tx).await?;
  Ok(())
}

async fn populate_dinoparc_servers(tx: &mut Transaction<'_, Postgres>) -> Result<(), Box<dyn Error + Send>> {
  #[derive(Debug, sqlx::FromRow)]
  struct Row {
    dinoparc_server: DinoparcServer,
  }

  let rows: Vec<Row> = sqlx::query_as::<_, Row>(
    r"
      SELECT dinoparc_server
      FROM dinoparc_servers;
    ",
  )
  .fetch_all(&mut *tx)
  .await
  .map_err(box_sqlx_error)?;

  let actual: BTreeSet<_> = rows.iter().map(|r| r.dinoparc_server).collect();
  let expected: BTreeSet<_> = DinoparcServer::iter().collect();

  if actual == expected {
    return Ok(());
  }

  for extra in actual.difference(&expected) {
    let res: PgQueryResult = sqlx::query(
      r"
      DELETE
      FROM dinoparc_servers
      WHERE dinoparc_server = $1::dinoparc_server;
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
      INTO dinoparc_servers(dinoparc_server)
      VALUES ($1::dinoparc_server)
      ON CONFLICT (dinoparc_server) DO NOTHING;
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
