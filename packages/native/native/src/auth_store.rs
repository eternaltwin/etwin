use crate::auth_store::mem::JsMemAuthStore;
use crate::auth_store::pg::JsPgAuthStore;
use crate::neon_helpers::NeonNamespace;
use etwin_core::auth::AuthStore;
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "mem", mem::create_namespace)?;
  ns.set_with(cx, "pg", pg::create_namespace)?;
  Ok(ns)
}

pub fn get_native_auth_store<'a, C: Context<'a>>(cx: &mut C, value: Handle<JsValue>) -> NeonResult<Arc<dyn AuthStore>> {
  match value.downcast::<JsMemAuthStore, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => match value.downcast::<JsPgAuthStore, _>(cx) {
      Ok(val) => {
        let val = Arc::clone(&**val);
        Ok(val)
      }
      Err(_) => cx.throw_type_error::<_, Arc<dyn AuthStore>>("JsMemAuthStore | JsPgAuthStore".to_string()),
    },
  }
}

pub mod mem {
  use crate::clock::get_native_clock;
  use crate::neon_helpers::{resolve_callback_with, NeonNamespace};
  use crate::uuid::get_native_uuid_generator;
  use etwin_auth_store::mem::MemAuthStore;
  use etwin_core::clock::Clock;
  use etwin_core::uuid::UuidGenerator;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsMemAuthStore = JsBox<Arc<MemAuthStore<Arc<dyn Clock>, Arc<dyn UuidGenerator>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let clock = cx.argument::<JsValue>(0)?;
    let uuid_generator = cx.argument::<JsValue>(1)?;
    let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let uuid_generator: Arc<dyn UuidGenerator> = get_native_uuid_generator(&mut cx, uuid_generator)?;
    let inner: Arc<MemAuthStore<Arc<dyn Clock>, Arc<dyn UuidGenerator>>> =
      Arc::new(MemAuthStore::new(clock, uuid_generator));

    let res = async move { inner };
    resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res| Ok(c.boxed(res).upcast()))
  }
}

pub mod pg {
  use crate::clock::get_native_clock;
  use crate::database::JsPgPool;
  use crate::neon_helpers::{resolve_callback_with, NeonNamespace};
  use crate::uuid::get_native_uuid_generator;
  use etwin_auth_store::pg::PgAuthStore;
  use etwin_core::clock::Clock;
  use etwin_core::core::Secret;
  use etwin_core::uuid::UuidGenerator;
  use neon::prelude::*;
  use sqlx::PgPool;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsPgAuthStore = JsBox<Arc<PgAuthStore<Arc<dyn Clock>, Arc<PgPool>, Arc<dyn UuidGenerator>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let clock = cx.argument::<JsValue>(0)?;
    let database = cx.argument::<JsPgPool>(1)?;
    let uuid_generator = cx.argument::<JsValue>(2)?;
    let secret = cx.argument::<JsString>(3)?;
    let cb = cx.argument::<JsFunction>(4)?.root(&mut cx);

    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let database = Arc::new(PgPool::clone(&database));
    let uuid_generator: Arc<dyn UuidGenerator> = get_native_uuid_generator(&mut cx, uuid_generator)?;
    let secret = Secret::new(secret.value(&mut cx));
    let res = async move {
      let auth_store = PgAuthStore::new(clock, database, uuid_generator, secret);
      #[allow(clippy::type_complexity)]
      let inner: Arc<PgAuthStore<Arc<dyn Clock>, Arc<PgPool>, Arc<dyn UuidGenerator>>> = Arc::new(auth_store);
      inner
    };

    resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res| Ok(c.boxed(res).upcast()))
  }
}
