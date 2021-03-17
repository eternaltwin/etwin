use crate::dinoparc_store::mem::JsMemDinoparcStore;
use crate::dinoparc_store::pg::JsPgDinoparcStore;
use crate::neon_helpers::{resolve_callback_serde, NeonNamespace};
use etwin_core::dinoparc::{DinoparcStore, GetDinoparcUserOptions, ShortDinoparcUser};
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "mem", mem::create_namespace)?;
  ns.set_with(cx, "pg", pg::create_namespace)?;
  ns.set_function(cx, "getShortUser", get_short_user)?;
  ns.set_function(cx, "touchShortUser", touch_short_user)?;
  Ok(ns)
}

pub fn get_native_dinoparc_store<'a, C: Context<'a>>(
  cx: &mut C,
  value: Handle<JsValue>,
) -> NeonResult<Arc<dyn DinoparcStore>> {
  match value.downcast::<JsMemDinoparcStore, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => match value.downcast::<JsPgDinoparcStore, _>(cx) {
      Ok(val) => {
        let val = Arc::clone(&**val);
        Ok(val)
      }
      Err(_) => cx.throw_type_error::<_, Arc<dyn DinoparcStore>>("JsMemDinoparcStore | JsPgDinoparcStore".to_string()),
    },
  }
}

pub fn get_short_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_dinoparc_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: GetDinoparcUserOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_short_user(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn touch_short_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_dinoparc_store(&mut cx, inner)?;
  let short_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let short: ShortDinoparcUser = serde_json::from_str(&short_json.value(&mut cx)).unwrap();

  let res = async move { inner.touch_short_user(&short).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub mod mem {
  use crate::clock::get_native_clock;
  use crate::neon_helpers::NeonNamespace;
  use etwin_core::clock::Clock;
  use etwin_dinoparc_store::mem::MemDinoparcStore;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsMemDinoparcStore = JsBox<Arc<MemDinoparcStore<Arc<dyn Clock>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsMemDinoparcStore> {
    let clock = cx.argument::<JsValue>(0)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let inner: Arc<MemDinoparcStore<Arc<dyn Clock>>> = Arc::new(MemDinoparcStore::new(clock));
    Ok(cx.boxed(inner))
  }
}

pub mod pg {
  use crate::clock::get_native_clock;
  use crate::database::JsPgPool;
  use crate::neon_helpers::{resolve_callback_with, NeonNamespace};
  use etwin_core::clock::Clock;
  use etwin_dinoparc_store::pg::PgDinoparcStore;
  use neon::prelude::*;
  use sqlx::PgPool;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsPgDinoparcStore = JsBox<Arc<PgDinoparcStore<Arc<dyn Clock>, Arc<PgPool>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let clock = cx.argument::<JsValue>(0)?;
    let database = cx.argument::<JsPgPool>(1)?;
    let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let database = Arc::new(PgPool::clone(&database));
    let res = async move {
      PgDinoparcStore::new(clock, database).await.map(|dinoparc_store| {
        #[allow(clippy::type_complexity)]
        let inner: Arc<PgDinoparcStore<Arc<dyn Clock>, Arc<PgPool>>> = Arc::new(dinoparc_store);
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
