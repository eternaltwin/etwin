use crate::hammerfest_client::http::JsHttpHammerfestClient;
use crate::hammerfest_client::mem::JsMemHammerfestClient;
use crate::hammerfest_store::mem::JsMemHammerfestStore;
use crate::hammerfest_store::pg::JsPgHammerfestStore;
use crate::neon_helpers::{resolve_callback, NeonNamespace};
use etwin_core::hammerfest::{
  GetHammerfestUserOptions, HammerfestClient, HammerfestCredentials, HammerfestForumThemeId, HammerfestForumThreadId,
  HammerfestGetProfileByIdOptions, HammerfestServer, HammerfestSession, HammerfestSessionKey, HammerfestStore,
  ShortHammerfestUser,
};
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "http", http::create_namespace)?;
  ns.set_with(cx, "mem", mem::create_namespace)?;
  ns.set_function(cx, "createSession", create_session)?;
  ns.set_function(cx, "testSession", test_session)?;
  ns.set_function(cx, "getProfileById", get_profile_by_id)?;
  ns.set_function(cx, "getForumThemePage", get_forum_theme_page)?;
  ns.set_function(cx, "getForumThemes", get_forum_themes)?;
  ns.set_function(cx, "getForumThreadPage", get_forum_thread_page)?;
  ns.set_function(cx, "getOwnGodChildren", get_own_god_children)?;
  ns.set_function(cx, "getOwnItems", get_own_items)?;
  ns.set_function(cx, "getOwnShop", get_own_shop)?;
  Ok(ns)
}

pub fn get_native_hammerfest_client<'a, C: Context<'a>>(
  cx: &mut C,
  value: Handle<JsValue>,
) -> NeonResult<Arc<dyn HammerfestClient>> {
  match value.downcast::<JsMemHammerfestClient, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => match value.downcast::<JsHttpHammerfestClient, _>(cx) {
      Ok(val) => {
        let val = Arc::clone(&**val);
        Ok(val)
      }
      Err(_) => cx
        .throw_type_error::<_, Arc<dyn HammerfestClient>>("JsMemHammerfestClient | JsHttpHammerfestClient".to_string()),
    },
  }
}

pub fn create_session(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_hammerfest_client(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: HammerfestCredentials = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.create_session(&options).await };
  resolve_callback(&mut cx, res, cb)
}

pub fn test_session(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_hammerfest_client(&mut cx, inner)?;
  let server_json = cx.argument::<JsString>(1)?;
  let key_json = cx.argument::<JsString>(2)?;
  let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

  let server: HammerfestServer = serde_json::from_str(&server_json.value(&mut cx)).unwrap();
  let key: HammerfestSessionKey = serde_json::from_str(&key_json.value(&mut cx)).unwrap();

  let res = async move { inner.test_session(server, &key).await };
  resolve_callback(&mut cx, res, cb)
}

pub fn get_profile_by_id(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_hammerfest_client(&mut cx, inner)?;
  let session_json = cx.argument::<JsString>(1)?;
  let options_json = cx.argument::<JsString>(2)?;
  let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

  let session: Option<HammerfestSession> = serde_json::from_str(&session_json.value(&mut cx)).unwrap();
  let options: HammerfestGetProfileByIdOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_profile_by_id(session.as_ref(), &options).await };
  resolve_callback(&mut cx, res, cb)
}

pub fn get_forum_theme_page(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_hammerfest_client(&mut cx, inner)?;
  let session_json = cx.argument::<JsString>(1)?;
  let server_json = cx.argument::<JsString>(2)?;
  let theme_id_json = cx.argument::<JsString>(3)?;
  let page1_json = cx.argument::<JsString>(4)?;
  let cb = cx.argument::<JsFunction>(5)?.root(&mut cx);

  let session: Option<HammerfestSession> = serde_json::from_str(&session_json.value(&mut cx)).unwrap();
  let server: HammerfestServer = serde_json::from_str(&server_json.value(&mut cx)).unwrap();
  let theme_id: HammerfestForumThemeId = serde_json::from_str(&theme_id_json.value(&mut cx)).unwrap();
  let page1: u32 = serde_json::from_str(&page1_json.value(&mut cx)).unwrap();

  let res = async move {
    inner
      .get_forum_theme_page(session.as_ref(), server, theme_id, page1)
      .await
  };
  resolve_callback(&mut cx, res, cb)
}

pub fn get_forum_themes(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_hammerfest_client(&mut cx, inner)?;
  let session_json = cx.argument::<JsString>(1)?;
  let server_json = cx.argument::<JsString>(2)?;
  let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

  let session: Option<HammerfestSession> = serde_json::from_str(&session_json.value(&mut cx)).unwrap();
  let server: HammerfestServer = serde_json::from_str(&server_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_forum_themes(session.as_ref(), server).await };
  resolve_callback(&mut cx, res, cb)
}

pub fn get_forum_thread_page(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_hammerfest_client(&mut cx, inner)?;
  let session_json = cx.argument::<JsString>(1)?;
  let server_json = cx.argument::<JsString>(2)?;
  let thread_id_json = cx.argument::<JsString>(3)?;
  let page1_json = cx.argument::<JsString>(4)?;
  let cb = cx.argument::<JsFunction>(5)?.root(&mut cx);

  let session: Option<HammerfestSession> = serde_json::from_str(&session_json.value(&mut cx)).unwrap();
  let server: HammerfestServer = serde_json::from_str(&server_json.value(&mut cx)).unwrap();
  let thread_id: HammerfestForumThreadId = serde_json::from_str(&thread_id_json.value(&mut cx)).unwrap();
  let page1: u32 = serde_json::from_str(&page1_json.value(&mut cx)).unwrap();

  let res = async move {
    inner
      .get_forum_thread_page(session.as_ref(), server, thread_id, page1)
      .await
  };
  resolve_callback(&mut cx, res, cb)
}

pub fn get_own_god_children(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_hammerfest_client(&mut cx, inner)?;
  let session_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let session: HammerfestSession = serde_json::from_str(&session_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_own_god_children(&session).await };
  resolve_callback(&mut cx, res, cb)
}

pub fn get_own_items(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_hammerfest_client(&mut cx, inner)?;
  let session_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let session: HammerfestSession = serde_json::from_str(&session_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_own_items(&session).await };
  resolve_callback(&mut cx, res, cb)
}

pub fn get_own_shop(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_hammerfest_client(&mut cx, inner)?;
  let session_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let session: HammerfestSession = serde_json::from_str(&session_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_own_shop(&session).await };
  resolve_callback(&mut cx, res, cb)
}

pub mod http {
  use crate::clock::get_native_clock;
  use crate::database::JsPgPool;
  use crate::neon_helpers::NeonNamespace;
  use etwin_core::clock::Clock;
  use etwin_hammerfest_client::HttpHammerfestClient;
  use etwin_hammerfest_store::pg::PgHammerfestStore;
  use neon::prelude::*;
  use sqlx::PgPool;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsHttpHammerfestClient = JsBox<Arc<HttpHammerfestClient<Arc<dyn Clock>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsHttpHammerfestClient> {
    let clock = cx.argument::<JsValue>(0)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let inner: Arc<HttpHammerfestClient<Arc<dyn Clock>>> = Arc::new(HttpHammerfestClient::new(clock).unwrap());
    Ok(cx.boxed(inner))
  }
}

pub mod mem {
  use crate::clock::get_native_clock;
  use crate::neon_helpers::NeonNamespace;
  use etwin_core::clock::Clock;
  use etwin_core::hammerfest::{HammerfestPassword, HammerfestServer, HammerfestUserId, HammerfestUsername};
  use etwin_hammerfest_client::MemHammerfestClient;
  use etwin_hammerfest_store::mem::MemHammerfestStore;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    ns.set_function(cx, "createUser", create_user)?;
    Ok(ns)
  }

  pub type JsMemHammerfestClient = JsBox<Arc<MemHammerfestClient<Arc<dyn Clock>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsMemHammerfestClient> {
    let clock = cx.argument::<JsValue>(0)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let inner: Arc<MemHammerfestClient<Arc<dyn Clock>>> = Arc::new(MemHammerfestClient::new(clock));
    Ok(cx.boxed(inner))
  }

  pub fn create_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let inner = cx.argument::<JsMemHammerfestClient>(0)?;
    let inner = Arc::clone(&inner);
    let server_json = cx.argument::<JsString>(1)?;
    let user_id_json = cx.argument::<JsString>(2)?;
    let username_json = cx.argument::<JsString>(3)?;
    let password_json = cx.argument::<JsString>(4)?;

    let server: HammerfestServer = serde_json::from_str(&server_json.value(&mut cx)).unwrap();
    let user_id: HammerfestUserId = serde_json::from_str(&user_id_json.value(&mut cx)).unwrap();
    let username: HammerfestUsername = serde_json::from_str(&username_json.value(&mut cx)).unwrap();
    let password: HammerfestPassword = serde_json::from_str(&password_json.value(&mut cx)).unwrap();

    inner.create_user(server, user_id, username, password);
    Ok(cx.undefined())
  }
}
