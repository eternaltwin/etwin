use crate::link_store::mem::JsMemLinkStore;
use crate::link_store::pg::JsPgLinkStore;
use crate::neon_helpers::{resolve_callback_serde, NeonNamespace};
use etwin_core::dinoparc::DinoparcUserIdRef;
use etwin_core::hammerfest::HammerfestUserIdRef;
use etwin_core::link::{DeleteLinkOptions, GetLinkOptions, GetLinksFromEtwinOptions, LinkStore, TouchLinkOptions};
use etwin_core::twinoid::TwinoidUserIdRef;
use etwin_core::types::AnyError;
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "mem", mem::create_namespace)?;
  ns.set_with(cx, "pg", pg::create_namespace)?;
  ns.set_function(cx, "getLinkFromDinoparc", get_link_from_dinoparc)?;
  ns.set_function(cx, "getLinkFromHammerfest", get_link_from_hammerfest)?;
  ns.set_function(cx, "getLinkFromTwinoid", get_link_from_twinoid)?;
  ns.set_function(cx, "getLinksFromEtwin", get_links_from_etwin)?;
  ns.set_function(cx, "touchDinoparcLink", touch_dinoparc_link)?;
  ns.set_function(cx, "touchHammerfestLink", touch_hammerfest_link)?;
  ns.set_function(cx, "touchTwinoidLink", touch_twinoid_link)?;
  ns.set_function(cx, "deleteDinoparcLink", delete_dinoparc_link)?;
  ns.set_function(cx, "deleteHammerfestLink", delete_hammerfest_link)?;
  ns.set_function(cx, "deleteTwinoidLink", delete_twinoid_link)?;
  Ok(ns)
}

pub fn get_native_link_store<'a, C: Context<'a>>(cx: &mut C, value: Handle<JsValue>) -> NeonResult<Arc<dyn LinkStore>> {
  match value.downcast::<JsMemLinkStore, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => match value.downcast::<JsPgLinkStore, _>(cx) {
      Ok(val) => {
        let val = Arc::clone(&**val);
        Ok(val)
      }
      Err(_) => cx.throw_type_error::<_, Arc<dyn LinkStore>>("JsMemLinkStore | JsPgLinkStore".to_string()),
    },
  }
}

pub fn get_link_from_dinoparc(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let inner = get_native_link_store(&mut cx, inner)?;
  let options: GetLinkOptions<DinoparcUserIdRef> = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_link_from_dinoparc(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn get_link_from_hammerfest(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_link_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: GetLinkOptions<HammerfestUserIdRef> = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_link_from_hammerfest(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn get_link_from_twinoid(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_link_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: GetLinkOptions<TwinoidUserIdRef> = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_link_from_twinoid(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn get_links_from_etwin(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_link_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: GetLinksFromEtwinOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_links_from_etwin(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn touch_dinoparc_link(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_link_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: TouchLinkOptions<DinoparcUserIdRef> = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move {
    inner
      .touch_dinoparc_link(&options)
      .await
      .map_err(|x| Box::new(x) as AnyError)
  };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn touch_hammerfest_link(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_link_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: TouchLinkOptions<HammerfestUserIdRef> = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move {
    inner
      .touch_hammerfest_link(&options)
      .await
      .map_err(|x| Box::new(x) as AnyError)
  };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn touch_twinoid_link(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_link_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: TouchLinkOptions<TwinoidUserIdRef> = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move {
    inner
      .touch_twinoid_link(&options)
      .await
      .map_err(|x| Box::new(x) as AnyError)
  };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn delete_dinoparc_link(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_link_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: DeleteLinkOptions<DinoparcUserIdRef> = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move {
    inner
      .delete_dinoparc_link(&options)
      .await
      .map_err(|x| Box::new(x) as AnyError)
  };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn delete_hammerfest_link(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_link_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: DeleteLinkOptions<HammerfestUserIdRef> = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move {
    inner
      .delete_hammerfest_link(&options)
      .await
      .map_err(|x| Box::new(x) as AnyError)
  };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn delete_twinoid_link(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_link_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: DeleteLinkOptions<TwinoidUserIdRef> = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move {
    inner
      .delete_twinoid_link(&options)
      .await
      .map_err(|x| Box::new(x) as AnyError)
  };
  resolve_callback_serde(&mut cx, res, cb)
}

pub mod mem {
  use crate::clock::get_native_clock;
  use crate::neon_helpers::NeonNamespace;
  use etwin_core::clock::Clock;
  use etwin_link_store::mem::MemLinkStore;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsMemLinkStore = JsBox<Arc<MemLinkStore<Arc<dyn Clock>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsMemLinkStore> {
    let clock = cx.argument::<JsValue>(0)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let inner: Arc<MemLinkStore<Arc<dyn Clock>>> = Arc::new(MemLinkStore::new(clock));
    Ok(cx.boxed(inner))
  }
}

pub mod pg {
  use crate::clock::get_native_clock;
  use crate::database::JsPgPool;
  use crate::neon_helpers::NeonNamespace;
  use etwin_core::clock::Clock;
  use etwin_link_store::pg::PgLinkStore;
  use neon::prelude::*;
  use sqlx::PgPool;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsPgLinkStore = JsBox<Arc<PgLinkStore<Arc<dyn Clock>, Arc<PgPool>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsPgLinkStore> {
    let clock = cx.argument::<JsValue>(0)?;
    let database = cx.argument::<JsPgPool>(1)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let database = Arc::new(PgPool::clone(&database));
    #[allow(clippy::type_complexity)]
    let inner: Arc<PgLinkStore<Arc<dyn Clock>, Arc<PgPool>>> = Arc::new(PgLinkStore::new(clock, database));
    Ok(cx.boxed(inner))
  }
}
