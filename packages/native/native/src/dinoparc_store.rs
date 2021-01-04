use crate::neon_namespace::NeonNamespace;
use neon::prelude::*;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "mem", mem::create_namespace)?;
  ns.set_with(cx, "pg", pg::create_namespace)?;
  Ok(ns)
}

pub mod mem {
  use crate::clock::get_native_clock;
  use crate::clock::system_clock::JsSystemClock;
  use crate::clock::virtual_clock::JsVirtualClock;
  use crate::neon_namespace::NeonNamespace;
  use crate::tokio_runtime::spawn_future;
  use etwin_core::clock::{Clock, SystemClock, VirtualClock};
  use etwin_core::dinoparc::{DinoparcStore, GetDinoparcUserOptions, ShortDinoparcUser};
  use etwin_dinoparc_store::mem::MemDinoparcStore;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    ns.set_function(cx, "getShortUser", get_short_user)?;
    ns.set_function(cx, "touchShortUser", touch_short_user)?;
    Ok(ns)
  }

  pub type JsMemDinoparcStore = JsBox<Arc<MemDinoparcStore<Arc<dyn Clock>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsMemDinoparcStore> {
    let clock = cx.argument::<JsValue>(0)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let inner: Arc<MemDinoparcStore<Arc<dyn Clock>>> = Arc::new(MemDinoparcStore::new(clock));
    Ok(cx.boxed(inner))
  }

  pub fn get_short_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let boxed = cx.argument::<JsMemDinoparcStore>(0)?;
    let options_json = cx.argument::<JsString>(1)?;
    let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

    let store = Arc::clone(&*boxed);
    let options: GetDinoparcUserOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

    let queue = cx.queue();
    spawn_future(Box::pin(async move {
      let user = store.get_short_user(&options).await.unwrap();
      let user_json = match user {
        Some(user) => Some(serde_json::to_string(&user).unwrap()),
        None => None,
      };
      queue.send(move |mut cx| {
        let cb = cb.into_inner(&mut cx);
        let this = cx.null();
        let err: Handle<JsValue> = cx.null().upcast();
        let res: Handle<JsValue> = match user_json {
          Some(user) => cx.string(user).upcast(),
          None => cx.null().upcast(),
        };
        let _ = cb.call(&mut cx, this, vec![err, res])?;
        Ok(())
      })
    }));

    Ok(cx.undefined())
  }

  pub fn touch_short_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let boxed = cx.argument::<JsMemDinoparcStore>(0)?;
    let short_json = cx.argument::<JsString>(1)?;
    let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

    let store = Arc::clone(&*boxed);
    let short: ShortDinoparcUser = serde_json::from_str(&short_json.value(&mut cx)).unwrap();

    let queue = cx.queue();
    spawn_future(Box::pin(async move {
      let user = store.touch_short_user(&short).await.unwrap();
      let user_json = serde_json::to_string(&user).unwrap();
      queue.send(move |mut cx| {
        let cb = cb.into_inner(&mut cx);
        let this = cx.null();
        let err: Handle<JsValue> = cx.null().upcast();
        let res: Handle<JsValue> = cx.string(user_json).upcast();
        let _ = cb.call(&mut cx, this, vec![err, res])?;
        Ok(())
      })
    }));

    Ok(cx.undefined())
  }
}

pub mod pg {
  use crate::clock::get_native_clock;
  use crate::clock::system_clock::JsSystemClock;
  use crate::clock::virtual_clock::JsVirtualClock;
  use crate::database::JsPgPool;
  use crate::neon_namespace::NeonNamespace;
  use crate::tokio_runtime::spawn_future;
  use etwin_core::clock::{Clock, SystemClock, VirtualClock};
  use etwin_core::dinoparc::{DinoparcStore, GetDinoparcUserOptions, ShortDinoparcUser};
  use etwin_dinoparc_store::pg::PgDinoparcStore;
  use neon::prelude::*;
  use sqlx::PgPool;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    ns.set_function(cx, "getShortUser", get_short_user)?;
    ns.set_function(cx, "touchShortUser", touch_short_user)?;
    Ok(ns)
  }

  pub type JsPgDinoparcStore = JsBox<Arc<PgDinoparcStore<Arc<dyn Clock>, Arc<PgPool>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsPgDinoparcStore> {
    let clock = cx.argument::<JsValue>(0)?;
    let database = cx.argument::<JsPgPool>(1)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let database = Arc::new(PgPool::clone(&database));
    let inner: Arc<PgDinoparcStore<Arc<dyn Clock>, Arc<PgPool>>> = Arc::new(PgDinoparcStore::new(clock, database));
    Ok(cx.boxed(inner))
  }

  pub fn get_short_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let boxed = cx.argument::<JsPgDinoparcStore>(0)?;
    let options_json = cx.argument::<JsString>(1)?;
    let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

    let store = Arc::clone(&*boxed);
    let options: GetDinoparcUserOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

    let queue = cx.queue();
    spawn_future(Box::pin(async move {
      let user = store.get_short_user(&options).await.unwrap();
      let user_json = match user {
        Some(user) => Some(serde_json::to_string(&user).unwrap()),
        None => None,
      };
      queue.send(move |mut cx| {
        let cb = cb.into_inner(&mut cx);
        let this = cx.null();
        let err: Handle<JsValue> = cx.null().upcast();
        let res: Handle<JsValue> = match user_json {
          Some(user) => cx.string(user).upcast(),
          None => cx.null().upcast(),
        };
        let _ = cb.call(&mut cx, this, vec![err, res])?;
        Ok(())
      })
    }));

    Ok(cx.undefined())
  }

  pub fn touch_short_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let boxed = cx.argument::<JsPgDinoparcStore>(0)?;
    let short_json = cx.argument::<JsString>(1)?;
    let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

    let store = Arc::clone(&*boxed);
    let short: ShortDinoparcUser = serde_json::from_str(&short_json.value(&mut cx)).unwrap();

    let queue = cx.queue();
    spawn_future(Box::pin(async move {
      let user = store.touch_short_user(&short).await.unwrap();
      let user_json = serde_json::to_string(&user).unwrap();
      queue.send(move |mut cx| {
        let cb = cb.into_inner(&mut cx);
        let this = cx.null();
        let err: Handle<JsValue> = cx.null().upcast();
        let res: Handle<JsValue> = cx.string(user_json).upcast();
        let _ = cb.call(&mut cx, this, vec![err, res])?;
        Ok(())
      })
    }));

    Ok(cx.undefined())
  }
}
