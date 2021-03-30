use neon::prelude::*;

mod clock;
mod database;
mod dinoparc_client;
mod dinoparc_store;
mod hammerfest_client;
mod hammerfest_store;
mod link_store;
mod neon_helpers;
mod password;
mod services;
mod token_store;
mod tokio_runtime;
mod twinoid_store;
mod user_store;
mod uuid;

fn export(mut cx: ModuleContext) -> NeonResult<()> {
  let cx = &mut cx;
  let clock = crate::clock::create_namespace(cx)?;
  cx.export_value("clock", clock)?;
  let database = crate::database::create_namespace(cx)?;
  cx.export_value("database", database)?;
  let dinoparc_client = crate::dinoparc_client::create_namespace(cx)?;
  cx.export_value("dinoparcClient", dinoparc_client)?;
  let dinoparc_store = crate::dinoparc_store::create_namespace(cx)?;
  cx.export_value("dinoparcStore", dinoparc_store)?;
  let hammerfest_client = crate::hammerfest_client::create_namespace(cx)?;
  cx.export_value("hammerfestClient", hammerfest_client)?;
  let hammerfest_store = crate::hammerfest_store::create_namespace(cx)?;
  cx.export_value("hammerfestStore", hammerfest_store)?;
  let link_store = crate::link_store::create_namespace(cx)?;
  cx.export_value("linkStore", link_store)?;
  let password = crate::password::create_namespace(cx)?;
  cx.export_value("password", password)?;
  let services = crate::services::create_namespace(cx)?;
  cx.export_value("services", services)?;
  let token_store = crate::token_store::create_namespace(cx)?;
  cx.export_value("tokenStore", token_store)?;
  let twinoid_store = crate::twinoid_store::create_namespace(cx)?;
  cx.export_value("twinoidStore", twinoid_store)?;
  let user_store = crate::user_store::create_namespace(cx)?;
  cx.export_value("userStore", user_store)?;
  let uuid = crate::uuid::create_namespace(cx)?;
  cx.export_value("uuid", uuid)?;
  Ok(())
}

#[neon::main]
fn main(cx: ModuleContext) -> NeonResult<()> {
  export(cx)
}
