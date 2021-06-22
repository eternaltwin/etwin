use crate::dinoparc_store::get_native_dinoparc_store;
use crate::link_store::get_native_link_store;
use crate::neon_helpers::{resolve_callback_serde, resolve_callback_with, NeonNamespace};
use crate::user_store::get_native_user_store;
use etwin_core::auth::AuthContext;
use etwin_core::dinoparc::{DinoparcStore, GetDinoparcUserOptions};
use etwin_core::link::LinkStore;
use etwin_core::user::UserStore;
use etwin_services::dinoparc::DinoparcService;
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_function(cx, "new", new)?;
  ns.set_function(cx, "getUser", get_user)?;
  Ok(ns)
}

pub type JsDinoparcService =
  JsBox<Arc<DinoparcService<Arc<dyn DinoparcStore>, Arc<dyn LinkStore>, Arc<dyn UserStore>>>>;

#[allow(clippy::type_complexity)]
pub fn get_native_dinoparc_service<'a, C: Context<'a>>(
  cx: &mut C,
  value: Handle<JsValue>,
) -> NeonResult<Arc<DinoparcService<Arc<dyn DinoparcStore>, Arc<dyn LinkStore>, Arc<dyn UserStore>>>> {
  match value.downcast::<JsDinoparcService, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => cx
      .throw_type_error::<_, Arc<DinoparcService<Arc<dyn DinoparcStore>, Arc<dyn LinkStore>, Arc<dyn UserStore>>>>(
        "JsDinoparcService".to_string(),
      ),
  }
}

pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let dinoparc_store = cx.argument::<JsValue>(0)?;
  let link_store = cx.argument::<JsValue>(1)?;
  let user_store = cx.argument::<JsValue>(2)?;
  let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

  let dinoparc_store: Arc<dyn DinoparcStore> = get_native_dinoparc_store(&mut cx, dinoparc_store)?;
  let link_store: Arc<dyn LinkStore> = get_native_link_store(&mut cx, link_store)?;
  let user_store: Arc<dyn UserStore> = get_native_user_store(&mut cx, user_store)?;

  let res = async move { Arc::new(DinoparcService::new(dinoparc_store, link_store, user_store)) };

  resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res| Ok(c.boxed(res).upcast()))
}

pub fn get_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_dinoparc_service(&mut cx, inner)?;
  let acx_json = cx.argument::<JsString>(1)?;
  let options_json = cx.argument::<JsString>(2)?;
  let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

  let acx: AuthContext = serde_json::from_str(&acx_json.value(&mut cx)).unwrap();
  let options: GetDinoparcUserOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_user(&acx, &options).await };
  resolve_callback_serde(&mut cx, res, cb)
}
