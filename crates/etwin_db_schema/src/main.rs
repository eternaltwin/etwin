use etwin_db_schema::{force_create_latest, get_state};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::error::Error;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let database: PgPool = PgPoolOptions::new()
    .max_connections(5)
    .connect("postgresql://etwin:dev@localhost:5432/etwindb")
    .await
    .unwrap();
  let database = &database;

  let cur_version = get_state(database).await.unwrap();
  println!("Current state: {:?}", cur_version);
  // force_create_latest(database).await.unwrap();
  Ok(())
}
