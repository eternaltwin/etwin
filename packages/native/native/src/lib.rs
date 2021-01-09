use neon::prelude::*;

mod clock;
mod database;
mod dinoparc_store;
mod hammerfest_client;
mod hammerfest_store;
mod neon_helpers;
mod tokio_runtime;
mod uuid;

fn export(mut cx: ModuleContext) -> NeonResult<()> {
  let cx = &mut cx;
  let clock = crate::clock::create_namespace(cx)?;
  cx.export_value("clock", clock)?;
  let database = crate::database::create_namespace(cx)?;
  cx.export_value("database", database)?;
  let dinoparc_store = crate::dinoparc_store::create_namespace(cx)?;
  cx.export_value("dinoparcStore", dinoparc_store)?;
  let hammerfest_client = crate::hammerfest_client::create_namespace(cx)?;
  cx.export_value("hammerfestClient", hammerfest_client)?;
  let hammerfest_store = crate::hammerfest_store::create_namespace(cx)?;
  cx.export_value("hammerfestStore", hammerfest_store)?;
  let uuid = crate::uuid::create_namespace(cx)?;
  cx.export_value("uuid", uuid)?;
  Ok(())
}

#[neon::main]
fn main(cx: ModuleContext) -> NeonResult<()> {
  export(cx)
}
