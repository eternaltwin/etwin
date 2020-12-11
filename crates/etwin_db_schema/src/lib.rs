use sqlx::{PgPool};
use include_dir::{include_dir, Dir};
use etwin_squirrel::{SchemaResolver, SchemaStateRef};
use std::error::Error;
use lazy_static::lazy_static;

const DB_SCRIPTS: Dir = include_dir!("../../db/scripts");

lazy_static! {
    static ref SQUIRREL: SchemaResolver = {
        SchemaResolver::new(&DB_SCRIPTS)
    };
}

pub async fn get_state(db: &PgPool) -> Result<SchemaStateRef<'static>, Box<dyn Error>> {
  SQUIRREL.get_state(db).await
}

pub async fn empty(db: &PgPool) -> Result<(), Box<dyn Error>> {
  SQUIRREL.empty(db).await
}

pub async fn force_create_latest(db: &PgPool) -> Result<(), Box<dyn Error>> {
  SQUIRREL.force_create_latest(db).await
}

pub async fn force_create(db: &PgPool, state: SchemaStateRef<'static>) -> Result<(), Box<dyn Error>> {
  SQUIRREL.force_create(db, state).await
}
