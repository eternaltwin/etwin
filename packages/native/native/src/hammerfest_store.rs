use crate::hammerfest_store::mem::JsMemHammerfestStore;
use crate::hammerfest_store::pg::JsPgHammerfestStore;
use crate::neon_helpers::{resolve_callback_serde, NeonNamespace};
use etwin_core::hammerfest::{GetHammerfestUserOptions, HammerfestStore, ShortHammerfestUser};
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

pub fn get_native_hammerfest_store<'a, C: Context<'a>>(
  cx: &mut C,
  value: Handle<JsValue>,
) -> NeonResult<Arc<dyn HammerfestStore>> {
  match value.downcast::<JsMemHammerfestStore, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => match value.downcast::<JsPgHammerfestStore, _>(cx) {
      Ok(val) => {
        let val = Arc::clone(&**val);
        Ok(val)
      }
      Err(_) => {
        cx.throw_type_error::<_, Arc<dyn HammerfestStore>>("JsMemHammerfestStore | JsPgHammerfestStore".to_string())
      }
    },
  }
}

pub fn get_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_hammerfest_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: GetHammerfestUserOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_user(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn get_short_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_hammerfest_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: GetHammerfestUserOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_short_user(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn touch_short_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_hammerfest_store(&mut cx, inner)?;
  let short_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let short: ShortHammerfestUser = serde_json::from_str(&short_json.value(&mut cx)).unwrap();

  let res = async move { inner.touch_short_user(&short).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub mod mem {
  use crate::clock::get_native_clock;
  use crate::neon_helpers::NeonNamespace;
  use etwin_core::clock::Clock;
  use etwin_hammerfest_store::mem::MemHammerfestStore;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsMemHammerfestStore = JsBox<Arc<MemHammerfestStore<Arc<dyn Clock>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsMemHammerfestStore> {
    let clock = cx.argument::<JsValue>(0)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let inner: Arc<MemHammerfestStore<Arc<dyn Clock>>> = Arc::new(MemHammerfestStore::new(clock));
    Ok(cx.boxed(inner))
  }
}

pub mod pg {
  use crate::clock::get_native_clock;
  use crate::database::JsPgPool;
  use crate::neon_helpers::{resolve_callback_with, NeonNamespace};
  use crate::uuid::get_native_uuid_generator;
  use etwin_core::clock::Clock;
  use etwin_core::core::Secret;
  use etwin_core::uuid::UuidGenerator;
  use etwin_hammerfest_store::pg::PgHammerfestStore;
  use neon::prelude::*;
  use sqlx::PgPool;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsPgHammerfestStore = JsBox<Arc<PgHammerfestStore<Arc<dyn Clock>, Arc<PgPool>, Arc<dyn UuidGenerator>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let clock = cx.argument::<JsValue>(0)?;
    let database = cx.argument::<JsPgPool>(1)?;
    let database_secret = cx.argument::<JsString>(2)?;
    let uuid_generator = cx.argument::<JsValue>(3)?;
    let cb = cx.argument::<JsFunction>(4)?.root(&mut cx);

    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let database = Arc::new(PgPool::clone(&database));
    let database_secret: String = database_secret.value(&mut cx);
    let database_secret = Secret::new(database_secret);
    let uuid_generator: Arc<dyn UuidGenerator> = get_native_uuid_generator(&mut cx, uuid_generator)?;
    let res = async move {
      PgHammerfestStore::new(clock, database, database_secret, uuid_generator)
        .await
        .map(|hammerfest_store| {
          #[allow(clippy::type_complexity)]
          let inner: Arc<PgHammerfestStore<Arc<dyn Clock>, Arc<PgPool>, Arc<dyn UuidGenerator>>> =
            Arc::new(hammerfest_store);
          inner
        })
    };

    resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res| {
      match res {
        Ok(inner) => Ok(c.boxed(inner).upcast()),
        // TODO: Remove this `unwrap`
        Err(e) => Err(JsError::error(c, format!("{}", e)).unwrap().upcast()),
      }
    })
  }
}
