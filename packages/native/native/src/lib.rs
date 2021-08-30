use crate::neon_helpers::ModuleContextExt;
use neon::prelude::*;
mod auth_store;
mod clock;
mod database;
mod dinoparc_client;
mod dinoparc_store;
mod email_formatter;
mod hammerfest_client;
mod hammerfest_store;
mod link_store;
mod mailer;
mod neon_helpers;
mod oauth_provider_store;
mod password;
mod rest;
mod services;
mod token_store;
mod tokio_runtime;
mod twinoid_client;
mod twinoid_store;
mod user_store;
mod uuid;

fn export(mut cx: ModuleContext) -> NeonResult<()> {
  let cx = &mut cx;
  cx.export_with("authStore", crate::auth_store::create_namespace)?;
  cx.export_with("clock", crate::clock::create_namespace)?;
  cx.export_with("database", crate::database::create_namespace)?;
  cx.export_with("dinoparcClient", crate::dinoparc_client::create_namespace)?;
  cx.export_with("dinoparcStore", crate::dinoparc_store::create_namespace)?;
  cx.export_with("emailFormatter", crate::email_formatter::create_namespace)?;
  cx.export_with("hammerfestClient", crate::hammerfest_client::create_namespace)?;
  cx.export_with("hammerfestStore", crate::hammerfest_store::create_namespace)?;
  cx.export_with("linkStore", crate::link_store::create_namespace)?;
  cx.export_with("mailer", crate::mailer::create_namespace)?;
  cx.export_with("oauthProviderStore", crate::oauth_provider_store::create_namespace)?;
  cx.export_with("password", crate::password::create_namespace)?;
  cx.export_with("rest", crate::rest::create_namespace)?;
  cx.export_with("services", crate::services::create_namespace)?;
  cx.export_with("tokenStore", crate::token_store::create_namespace)?;
  cx.export_with("twinoidClient", crate::twinoid_client::create_namespace)?;
  cx.export_with("twinoidStore", crate::twinoid_store::create_namespace)?;
  cx.export_with("userStore", crate::user_store::create_namespace)?;
  cx.export_with("uuid", crate::uuid::create_namespace)?;
  Ok(())
}

#[neon::main]
fn main(cx: ModuleContext) -> NeonResult<()> {
  export(cx)
}
