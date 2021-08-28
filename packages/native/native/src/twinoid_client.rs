use crate::neon_helpers::{resolve_callback_serde, NeonNamespace};
use crate::twinoid_client::http::JsHttpTwinoidClient;
use etwin_core::oauth::RfcOauthAccessTokenKey;
use etwin_core::twinoid::{TwinoidApiAuth, TwinoidClient};
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "http", http::create_namespace)?;
  ns.set_function(cx, "getMe", get_me)?;
  Ok(ns)
}

pub fn get_native_twinoid_client<'a, C: Context<'a>>(
  cx: &mut C,
  value: Handle<JsValue>,
) -> NeonResult<Arc<dyn TwinoidClient>> {
  match value.downcast::<JsHttpTwinoidClient, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => cx.throw_type_error::<_, Arc<dyn TwinoidClient>>("JsHttpTwinoidClient".to_string()),
  }
}

pub fn get_me(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_twinoid_client(&mut cx, inner)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let options: RfcOauthAccessTokenKey = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.get_me_short(TwinoidApiAuth::Token(options)).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub mod http {
  use crate::clock::get_native_clock;
  use crate::neon_helpers::NeonNamespace;
  use etwin_core::clock::Clock;
  use etwin_twinoid_client::http::HttpTwinoidClient;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsHttpTwinoidClient = JsBox<Arc<HttpTwinoidClient<Arc<dyn Clock>>>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsHttpTwinoidClient> {
    let clock = cx.argument::<JsValue>(0)?;
    let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
    #[allow(clippy::type_complexity)]
    let inner: Arc<HttpTwinoidClient<Arc<dyn Clock>>> = Arc::new(HttpTwinoidClient::new(clock).unwrap());
    Ok(cx.boxed(inner))
  }
}
