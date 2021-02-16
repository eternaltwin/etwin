use crate::neon_helpers::{resolve_callback_serde, NeonNamespace};
use crate::user_store::mem::JsMemUserStore;
use crate::user_store::pg::JsPgUserStore;
use etwin_core::user::{CreateUserOptions, GetShortUserOptions, GetUserOptions, UserIdRef, UserStore};
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "mem", mem::create_namespace)?;
  ns.set_with(cx, "pg", pg::create_namespace)?;
  ns.set_function(cx, "createUser", create_user)?;
  ns.set_function(cx, "getUser", get_user)?;
  ns.set_function(cx, "getShortUser", get_short_user)?;
  ns.set_function(cx, "hardDeleteUserById", hard_delete_user_by_id)?;
  Ok(ns)
}

pub fn get_native_user_store<'a, C: Context<'a>>(cx: &mut C, value: Handle<JsValue>) -> NeonResult<Arc<dyn UserStore>> {
  match value.downcast::<JsMemUserStore, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => match value.downcast::<JsPgUserStore, _>(cx) {
      Ok(val) => {
        let val = Arc::clone(&**val);
        Ok(val)
      }
      Err(_) => cx.throw_type_error::<_, Arc<dyn UserStore>>("JsMemUserStore | JsPgUserStore".to_string()),
    },
  }
}

pub fn create_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_user_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: CreateUserOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.create_user(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn get_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_user_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: GetUserOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_user(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn get_short_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_user_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: GetShortUserOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_short_user(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn hard_delete_user_by_id(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_user_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: UserIdRef = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.hard_delete_user_by_id(options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub mod mem {
  use crate::clock::get_native_clock;
  use crate::neon_helpers::NeonNamespace;
  use crate::uuid::get_native_uuid_generator;
  use etwin_core::clock::Clock;
  use etwin_core::uuid::UuidGenerator;
  use etwin_user_store::mem::MemUserStore;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsMemUserStore = JsBox<Arc<MemUserStore<Arc<dyn Clock>, Arc<dyn UuidGenerator>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsMemUserStore> {
    let clock = cx.argument::<JsValue>(0)?;
    let uuid_generator = cx.argument::<JsValue>(1)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let uuid_generator: Arc<dyn UuidGenerator> = get_native_uuid_generator(&mut cx, uuid_generator)?;
    let inner: Arc<MemUserStore<Arc<dyn Clock>, Arc<dyn UuidGenerator>>> =
      Arc::new(MemUserStore::new(clock, uuid_generator));
    Ok(cx.boxed(inner))
  }
}

pub mod pg {
  use crate::clock::get_native_clock;
  use crate::database::JsPgPool;
  use crate::neon_helpers::NeonNamespace;
  use crate::uuid::get_native_uuid_generator;
  use etwin_core::clock::Clock;
  use etwin_core::core::Secret;
  use etwin_core::uuid::UuidGenerator;
  use etwin_user_store::pg::PgUserStore;
  use neon::prelude::*;
  use sqlx::PgPool;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsPgUserStore = JsBox<Arc<PgUserStore<Arc<dyn Clock>, Arc<PgPool>, Arc<dyn UuidGenerator>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsPgUserStore> {
    let clock = cx.argument::<JsValue>(0)?;
    let database = cx.argument::<JsPgPool>(1)?;
    let database_secret = cx.argument::<JsString>(2)?;
    let uuid_generator = cx.argument::<JsValue>(3)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let database = Arc::new(PgPool::clone(&database));
    let database_secret: String = database_secret.value(&mut cx);
    let database_secret = Secret::new(database_secret);
    let uuid_generator: Arc<dyn UuidGenerator> = get_native_uuid_generator(&mut cx, uuid_generator)?;
    #[allow(clippy::type_complexity)]
    let inner: Arc<PgUserStore<Arc<dyn Clock>, Arc<PgPool>, Arc<dyn UuidGenerator>>> =
      Arc::new(PgUserStore::new(clock, database, database_secret, uuid_generator));
    Ok(cx.boxed(inner))
  }
}
