use crate::neon_helpers::{resolve_callback, NeonNamespace};
use crate::twinoid_store::mem::JsMemTwinoidStore;
use crate::twinoid_store::pg::JsPgTwinoidStore;
use etwin_core::twinoid::{GetTwinoidUserOptions, ShortTwinoidUser, TwinoidStore};
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "mem", mem::create_namespace)?;
  ns.set_with(cx, "pg", pg::create_namespace)?;
  ns.set_function(cx, "getUser", get_user)?;
  ns.set_function(cx, "getShortUser", get_short_user)?;
  ns.set_function(cx, "touchShortUser", touch_short_user)?;
  Ok(ns)
}

pub fn get_native_twinoid_store<'a, C: Context<'a>>(
  cx: &mut C,
  value: Handle<JsValue>,
) -> NeonResult<Arc<dyn TwinoidStore>> {
  match value.downcast::<JsMemTwinoidStore, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => match value.downcast::<JsPgTwinoidStore, _>(cx) {
      Ok(val) => {
        let val = Arc::clone(&**val);
        Ok(val)
      }
      Err(_) => cx.throw_type_error::<_, Arc<dyn TwinoidStore>>("JsMemTwinoidStore | JsPgTwinoidStore".to_string()),
    },
  }
}

pub fn get_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_twinoid_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: GetTwinoidUserOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_user(&options).await };
  resolve_callback(&mut cx, res, cb)
}

pub fn get_short_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_twinoid_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: GetTwinoidUserOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_short_user(&options).await };
  resolve_callback(&mut cx, res, cb)
}

pub fn touch_short_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_twinoid_store(&mut cx, inner)?;
  let short_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let short: ShortTwinoidUser = serde_json::from_str(&short_json.value(&mut cx)).unwrap();

  let res = async move { inner.touch_short_user(&short).await };
  resolve_callback(&mut cx, res, cb)
}

pub mod mem {
  use crate::clock::get_native_clock;
  use crate::neon_helpers::NeonNamespace;
  use etwin_core::clock::Clock;
  use etwin_twinoid_store::mem::MemTwinoidStore;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsMemTwinoidStore = JsBox<Arc<MemTwinoidStore<Arc<dyn Clock>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsMemTwinoidStore> {
    let clock = cx.argument::<JsValue>(0)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let inner: Arc<MemTwinoidStore<Arc<dyn Clock>>> = Arc::new(MemTwinoidStore::new(clock));
    Ok(cx.boxed(inner))
  }
}

pub mod pg {
  use crate::clock::get_native_clock;
  use crate::database::JsPgPool;
  use crate::neon_helpers::NeonNamespace;
  use etwin_core::clock::Clock;
  use etwin_twinoid_store::pg::PgTwinoidStore;
  use neon::prelude::*;
  use sqlx::PgPool;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsPgTwinoidStore = JsBox<Arc<PgTwinoidStore<Arc<dyn Clock>, Arc<PgPool>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsPgTwinoidStore> {
    let clock = cx.argument::<JsValue>(0)?;
    let database = cx.argument::<JsPgPool>(1)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let database = Arc::new(PgPool::clone(&database));
    let inner: Arc<PgTwinoidStore<Arc<dyn Clock>, Arc<PgPool>>> = Arc::new(PgTwinoidStore::new(clock, database));
    Ok(cx.boxed(inner))
  }
}
