use crate::neon_helpers::{resolve_callback_serde, NeonNamespace};
use crate::token_store::mem::JsMemTokenStore;
use crate::token_store::pg::JsPgTokenStore;
use etwin_core::dinoparc::{DinoparcServer, DinoparcSessionKey, DinoparcUserIdRef};
use etwin_core::hammerfest::{HammerfestServer, HammerfestSessionKey, HammerfestUserIdRef};
use etwin_core::oauth::{RfcOauthAccessTokenKey, RfcOauthRefreshTokenKey};
use etwin_core::token::{TokenStore, TouchOauthTokenOptions};
use etwin_core::twinoid::TwinoidUserIdRef;
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "mem", mem::create_namespace)?;
  ns.set_with(cx, "pg", pg::create_namespace)?;
  ns.set_function(cx, "touchTwinoidOauth", touch_twinoid_oauth)?;
  ns.set_function(cx, "revokeTwinoidAccessToken", revoke_twinoid_access_token)?;
  ns.set_function(cx, "revokeTwinoidRefreshToken", revoke_twinoid_refresh_token)?;
  ns.set_function(cx, "getTwinoidOauth", get_twinoid_oauth)?;
  ns.set_function(cx, "touchDinoparc", touch_dinoparc)?;
  ns.set_function(cx, "revokeDinoparc", revoke_dinoparc)?;
  ns.set_function(cx, "getDinoparc", get_dinoparc)?;
  ns.set_function(cx, "touchHammerfest", touch_hammerfest)?;
  ns.set_function(cx, "revokeHammerfest", revoke_hammerfest)?;
  ns.set_function(cx, "getHammerfest", get_hammerfest)?;
  Ok(ns)
}

pub fn get_native_token_store<'a, C: Context<'a>>(
  cx: &mut C,
  value: Handle<JsValue>,
) -> NeonResult<Arc<dyn TokenStore>> {
  match value.downcast::<JsMemTokenStore, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => match value.downcast::<JsPgTokenStore, _>(cx) {
      Ok(val) => {
        let val = Arc::clone(&**val);
        Ok(val)
      }
      Err(_) => cx.throw_type_error::<_, Arc<dyn TokenStore>>("JsMemTokenStore | JsPgTokenStore".to_string()),
    },
  }
}

pub fn touch_twinoid_oauth(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_token_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: TouchOauthTokenOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.touch_twinoid_oauth(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn revoke_twinoid_access_token(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_token_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: RfcOauthAccessTokenKey = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.revoke_twinoid_access_token(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn revoke_twinoid_refresh_token(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_token_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: RfcOauthRefreshTokenKey = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.revoke_twinoid_refresh_token(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn get_twinoid_oauth(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_token_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: TwinoidUserIdRef = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_twinoid_oauth(options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn touch_dinoparc(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_token_store(&mut cx, inner)?;
  let user_json = cx.argument::<JsString>(1)?;
  let key_json = cx.argument::<JsString>(2)?;
  let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

  let user: DinoparcUserIdRef = serde_json::from_str(&user_json.value(&mut cx)).unwrap();
  let key: DinoparcSessionKey = serde_json::from_str(&key_json.value(&mut cx)).unwrap();

  let res = async move { inner.touch_dinoparc(user, &key).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn revoke_dinoparc(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_token_store(&mut cx, inner)?;
  let server_json = cx.argument::<JsString>(1)?;
  let key_json = cx.argument::<JsString>(2)?;
  let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

  let server: DinoparcServer = serde_json::from_str(&server_json.value(&mut cx)).unwrap();
  let key: DinoparcSessionKey = serde_json::from_str(&key_json.value(&mut cx)).unwrap();

  let res = async move { inner.revoke_dinoparc(server, &key).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn get_dinoparc(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_token_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: DinoparcUserIdRef = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_dinoparc(options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn touch_hammerfest(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_token_store(&mut cx, inner)?;
  let user_json = cx.argument::<JsString>(1)?;
  let key_json = cx.argument::<JsString>(2)?;
  let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

  let user: HammerfestUserIdRef = serde_json::from_str(&user_json.value(&mut cx)).unwrap();
  let key: HammerfestSessionKey = serde_json::from_str(&key_json.value(&mut cx)).unwrap();

  let res = async move { inner.touch_hammerfest(user, &key).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn revoke_hammerfest(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_token_store(&mut cx, inner)?;
  let server_json = cx.argument::<JsString>(1)?;
  let key_json = cx.argument::<JsString>(2)?;
  let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

  let server: HammerfestServer = serde_json::from_str(&server_json.value(&mut cx)).unwrap();
  let key: HammerfestSessionKey = serde_json::from_str(&key_json.value(&mut cx)).unwrap();

  let res = async move { inner.revoke_hammerfest(server, &key).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn get_hammerfest(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_token_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: HammerfestUserIdRef = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_hammerfest(options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub mod mem {
  use crate::clock::get_native_clock;
  use crate::neon_helpers::NeonNamespace;
  use etwin_core::clock::Clock;
  use etwin_token_store::mem::MemTokenStore;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsMemTokenStore = JsBox<Arc<MemTokenStore<Arc<dyn Clock>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsMemTokenStore> {
    let clock = cx.argument::<JsValue>(0)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let inner: Arc<MemTokenStore<Arc<dyn Clock>>> = Arc::new(MemTokenStore::new(clock));
    Ok(cx.boxed(inner))
  }
}

pub mod pg {
  use crate::clock::get_native_clock;
  use crate::database::JsPgPool;
  use crate::neon_helpers::{resolve_callback_with, NeonNamespace};
  use etwin_core::clock::Clock;
  use etwin_core::core::Secret;
  use etwin_token_store::pg::PgTokenStore;
  use neon::prelude::*;
  use sqlx::PgPool;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsPgTokenStore = JsBox<Arc<PgTokenStore<Arc<dyn Clock>, Arc<PgPool>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let clock = cx.argument::<JsValue>(0)?;
    let database = cx.argument::<JsPgPool>(1)?;
    let database_secret = cx.argument::<JsString>(2)?;
    let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let database = Arc::new(PgPool::clone(&database));
    let database_secret: String = database_secret.value(&mut cx);
    let database_secret = Secret::new(database_secret);
    let res = async move {
      PgTokenStore::new(clock, database, database_secret).await.map(|store| {
        #[allow(clippy::type_complexity)]
        let inner: Arc<PgTokenStore<Arc<dyn Clock>, Arc<PgPool>>> = Arc::new(store);
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
