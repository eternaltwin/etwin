use etwin_squirrel::{SchemaResolver, SchemaStateRef};
use include_dir::{include_dir, Dir};
use lazy_static::lazy_static;
use sqlx::PgPool;
use std::error::Error;
pub mod schema;

const DB_SCRIPTS: Dir = include_dir!("./scripts");

lazy_static! {
  static ref SQUIRREL: SchemaResolver = SchemaResolver::new(&DB_SCRIPTS);
}

pub async fn get_state(db: &PgPool) -> Result<SchemaStateRef<'static>, Box<dyn Error>> {
  SQUIRREL.get_state(db).await
}

pub async fn empty(db: &PgPool) -> Result<(), Box<dyn Error>> {
  SQUIRREL.empty(db).await
}

pub async fn force_create_latest(db: &PgPool, void: bool) -> Result<(), Box<dyn Error>> {
  SQUIRREL.force_create_latest(db, void).await
}

pub async fn force_create(db: &PgPool, state: SchemaStateRef<'static>, void: bool) -> Result<(), Box<dyn Error>> {
  SQUIRREL.force_create(db, state, void).await
}
