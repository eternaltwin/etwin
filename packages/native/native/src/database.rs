use crate::clock::system_clock::JsSystemClock;
use crate::neon_helpers::NeonNamespace;
use crate::tokio_runtime::spawn_future;
use etwin_core::clock::Clock;
use etwin_core::dinoparc::{DinoparcStore, GetDinoparcUserOptions, ShortDinoparcUser};
use etwin_dinoparc_store::mem::MemDinoparcStore;
use neon::prelude::*;
use serde::{Deserialize, Serialize};
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;
use std::ops::Deref;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_function(cx, "new", new)?;
  Ok(ns)
}

pub struct PgPoolHandle(PgPool);

impl PgPoolHandle {
  pub const fn new(inner: PgPool) -> Self {
    Self(inner)
  }
}

impl Deref for PgPoolHandle {
  type Target = PgPool;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl Finalize for PgPoolHandle {}

pub type JsPgPool = JsBox<PgPoolHandle>;

#[derive(Debug, Serialize, Deserialize)]
struct NewOptions {
  /// Database cluster hostname
  host: String,
  /// Database cluster port
  port: u16,
  /// Database name
  name: String,
  /// Database user name
  user: String,
  /// Database user password
  password: String,
}

pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let options_json = cx.argument::<JsString>(0)?;
  let cb = cx.argument::<JsFunction>(1)?.root(&mut cx);

  let options: NewOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let queue = cx.queue();
  spawn_future(Box::pin(async move {
    let connect_options = PgConnectOptions::new()
      .host(&options.host)
      .port(options.port)
      .database(&options.name)
      .username(&options.user)
      .password(&options.password);
    let pool = PgPoolOptions::new()
      .max_connections(5)
      .connect_with(connect_options)
      .await;

    queue.send(move |mut cx| {
      let cb = cb.into_inner(&mut cx);
      let this = cx.null();
      let (err, res) = match pool {
        Ok(pool) => {
          let err: Handle<JsValue> = cx.null().upcast();
          let res: Handle<JsValue> = cx.boxed(PgPoolHandle::new(pool)).upcast();
          (err, res)
        }
        Err(e) => {
          let err: Handle<JsValue> = cx.error(e.to_string())?.upcast();
          let res: Handle<JsValue> = cx.null().upcast();
          (err, res)
        }
      };
      let _ = cb.call(&mut cx, this, vec![err, res])?;
      Ok(())
    })
  }));

  Ok(cx.undefined())
}
