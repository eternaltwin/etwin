use crate::neon_helpers::{resolve_callback_serde, NeonNamespace};
use crate::oauth_provider_store::mem::JsMemOauthProviderStore;
use crate::oauth_provider_store::pg::JsPgMemOauthProviderStore;
use etwin_core::oauth::{OauthProviderStore, UpsertSystemClientOptions};
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "mem", mem::create_namespace)?;
  ns.set_with(cx, "pg", pg::create_namespace)?;
  ns.set_function(cx, "upsertSystemClient", upsert_system_client)?;
  Ok(ns)
}

pub fn get_native_oauth_provider_store<'a, C: Context<'a>>(
  cx: &mut C,
  value: Handle<JsValue>,
) -> NeonResult<Arc<dyn OauthProviderStore>> {
  match value.downcast::<JsMemOauthProviderStore, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => match value.downcast::<JsPgMemOauthProviderStore, _>(cx) {
      Ok(val) => {
        let val = Arc::clone(&**val);
        Ok(val)
      }
      Err(_) => cx.throw_type_error::<_, Arc<dyn OauthProviderStore>>(
        "JsMemOauthProviderStore | JsPgMemOauthProviderStore".to_string(),
      ),
    },
  }
}

pub fn upsert_system_client(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_oauth_provider_store(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let credentials: UpsertSystemClientOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.upsert_system_client(&credentials).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub mod mem {
  use crate::clock::get_native_clock;
  use crate::neon_helpers::{resolve_callback_with, NeonNamespace};
  use crate::password::get_native_password;
  use crate::uuid::get_native_uuid_generator;
  use etwin_core::clock::Clock;
  use etwin_core::password::PasswordService;
  use etwin_core::uuid::UuidGenerator;
  use etwin_oauth_provider_store::mem::MemOauthProviderStore;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsMemOauthProviderStore =
    JsBox<Arc<MemOauthProviderStore<Arc<dyn Clock>, Arc<dyn PasswordService>, Arc<dyn UuidGenerator>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let clock = cx.argument::<JsValue>(0)?;
    let password = cx.argument::<JsValue>(1)?;
    let uuid_generator = cx.argument::<JsValue>(2)?;
    let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let password: Arc<dyn PasswordService> = get_native_password(&mut cx, password)?;
    let uuid_generator: Arc<dyn UuidGenerator> = get_native_uuid_generator(&mut cx, uuid_generator)?;

    let inner: Arc<MemOauthProviderStore<Arc<dyn Clock>, Arc<dyn PasswordService>, Arc<dyn UuidGenerator>>> =
      Arc::new(MemOauthProviderStore::new(clock, password, uuid_generator));

    let res = async move { inner };
    resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res| Ok(c.boxed(res).upcast()))
  }
}

pub mod pg {
  use crate::clock::get_native_clock;
  use crate::database::JsPgPool;
  use crate::neon_helpers::{resolve_callback_with, NeonNamespace};
  use crate::password::get_native_password;
  use crate::uuid::get_native_uuid_generator;
  use etwin_core::clock::Clock;
  use etwin_core::core::Secret;
  use etwin_core::password::PasswordService;
  use etwin_core::uuid::UuidGenerator;
  use etwin_oauth_provider_store::pg::PgOauthProviderStore;
  use neon::prelude::*;
  use sqlx::PgPool;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsPgMemOauthProviderStore =
    JsBox<Arc<PgOauthProviderStore<Arc<dyn Clock>, Arc<PgPool>, Arc<dyn PasswordService>, Arc<dyn UuidGenerator>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let clock = cx.argument::<JsValue>(0)?;
    let database = cx.argument::<JsPgPool>(1)?;
    let password = cx.argument::<JsValue>(2)?;
    let uuid_generator = cx.argument::<JsValue>(3)?;
    let secret = cx.argument::<JsString>(4)?;
    let cb = cx.argument::<JsFunction>(5)?.root(&mut cx);

    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    let database = Arc::new(PgPool::clone(&database));
    let password: Arc<dyn PasswordService> = get_native_password(&mut cx, password)?;
    let uuid_generator: Arc<dyn UuidGenerator> = get_native_uuid_generator(&mut cx, uuid_generator)?;
    let secret = Secret::new(secret.value(&mut cx));

    let res = async move {
      let oauth_provider_store = PgOauthProviderStore::new(clock, database, password, uuid_generator, secret);
      #[allow(clippy::type_complexity)]
      let inner: Arc<
        PgOauthProviderStore<Arc<dyn Clock>, Arc<PgPool>, Arc<dyn PasswordService>, Arc<dyn UuidGenerator>>,
      > = Arc::new(oauth_provider_store);
      inner
    };

    resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res| Ok(c.boxed(res).upcast()))
  }
}
