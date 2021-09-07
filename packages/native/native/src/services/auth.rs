use crate::auth_store::get_native_auth_store;
use crate::clock::get_native_clock;
use crate::dinoparc_client::get_native_dinoparc_client;
use crate::dinoparc_store::get_native_dinoparc_store;
use crate::email_formatter::get_native_email_formatter;
use crate::hammerfest_client::get_native_hammerfest_client;
use crate::hammerfest_store::get_native_hammerfest_store;
use crate::link_store::get_native_link_store;
use crate::mailer::get_native_mailer;
use crate::neon_helpers::{resolve_callback_serde, resolve_callback_with, NeonNamespace};
use crate::oauth_provider_store::get_native_oauth_provider_store;
use crate::password::get_native_password;
use crate::twinoid_client::get_native_twinoid_client;
use crate::twinoid_store::get_native_twinoid_store;
use crate::user_store::get_native_user_store;
use crate::uuid::get_native_uuid_generator;
use etwin_core::auth::{
  AuthContext, AuthStore, CreateAccessTokenOptions, EtwinOauthAccessTokenKey, GrantOauthAuthorizationOptions,
  RawCredentials, RawUserCredentials, RegisterOrLoginWithEmailOptions, RegisterWithUsernameOptions,
  RegisterWithVerifiedEmailOptions, SessionId,
};
use etwin_core::clock::Clock;
use etwin_core::dinoparc::{DinoparcClient, DinoparcCredentials, DinoparcStore};
use etwin_core::email::{EmailFormatter, Mailer};
use etwin_core::hammerfest::{HammerfestClient, HammerfestCredentials, HammerfestStore};
use etwin_core::link::LinkStore;
use etwin_core::oauth::{OauthProviderStore, RfcOauthAccessTokenKey};
use etwin_core::password::PasswordService;
use etwin_core::twinoid::{TwinoidClient, TwinoidStore};
use etwin_core::types::AnyError;
use etwin_core::user::UserStore;
use etwin_core::uuid::UuidGenerator;
use etwin_services::auth::{AuthService, DynAuthService};
use neon::borrow::Ref;
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_function(cx, "new", new)?;
  ns.set_function(cx, "authenticateAccessToken", authenticate_access_token)?;
  ns.set_function(cx, "grantOauthAuthorization", grant_oauth_authorization)?;
  ns.set_function(cx, "createAccessToken", create_access_token)?;
  ns.set_function(cx, "registerOrLoginWithEmail", register_or_login_with_email)?;
  ns.set_function(cx, "registerWithVerifiedEmail", register_with_verified_email)?;
  ns.set_function(cx, "registerWithUsername", register_with_username)?;
  ns.set_function(cx, "rawLoginWithCredentials", raw_login_with_credentials)?;
  ns.set_function(cx, "registerOrLoginWithDinoparc", register_or_login_with_dinoparc)?;
  ns.set_function(cx, "registerOrLoginWithHammerfest", register_or_login_with_hammerfest)?;
  ns.set_function(
    cx,
    "registerOrLoginWithTwinoidOauth",
    register_or_login_with_twinoid_oauth,
  )?;
  ns.set_function(cx, "authenticateSession", authenticate_session)?;
  ns.set_function(cx, "rawAuthenticateCredentials", raw_authenticate_credentials)?;
  Ok(ns)
}

pub type JsAuthService = JsBox<Arc<DynAuthService>>;

#[allow(clippy::type_complexity)]
pub fn get_native_auth_service<'a, C: Context<'a>>(
  cx: &mut C,
  value: Handle<JsValue>,
) -> NeonResult<Arc<DynAuthService>> {
  match value.downcast::<JsAuthService, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => cx.throw_type_error::<_, Arc<DynAuthService>>("JsAuthService".to_string()),
  }
}

pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let auth_store = cx.argument::<JsValue>(0)?;
  let clock = cx.argument::<JsValue>(1)?;
  let dinoparc_client = cx.argument::<JsValue>(2)?;
  let dinoparc_store = cx.argument::<JsValue>(3)?;
  let email_formatter = cx.argument::<JsValue>(4)?;
  let hammerfest_client = cx.argument::<JsValue>(5)?;
  let hammerfest_store = cx.argument::<JsValue>(6)?;
  let link_store = cx.argument::<JsValue>(7)?;
  let mailer = cx.argument::<JsValue>(8)?;
  let oauth_provider_store = cx.argument::<JsValue>(9)?;
  let password_service = cx.argument::<JsValue>(10)?;
  let user_store = cx.argument::<JsValue>(11)?;
  let twinoid_client = cx.argument::<JsValue>(12)?;
  let twinoid_store = cx.argument::<JsValue>(13)?;
  let uuid_generator = cx.argument::<JsValue>(14)?;
  let auth_secret = cx.argument::<JsBuffer>(15)?;
  let cb = cx.argument::<JsFunction>(16)?.root(&mut cx);

  let auth_store: Arc<dyn AuthStore> = get_native_auth_store(&mut cx, auth_store)?;
  let clock: Arc<dyn Clock> = get_native_clock(&mut cx, clock)?;
  let dinoparc_client: Arc<dyn DinoparcClient> = get_native_dinoparc_client(&mut cx, dinoparc_client)?;
  let dinoparc_store: Arc<dyn DinoparcStore> = get_native_dinoparc_store(&mut cx, dinoparc_store)?;
  let email_formatter: Arc<dyn EmailFormatter> = get_native_email_formatter(&mut cx, email_formatter)?;
  let hammerfest_client: Arc<dyn HammerfestClient> = get_native_hammerfest_client(&mut cx, hammerfest_client)?;
  let hammerfest_store: Arc<dyn HammerfestStore> = get_native_hammerfest_store(&mut cx, hammerfest_store)?;
  let link_store: Arc<dyn LinkStore> = get_native_link_store(&mut cx, link_store)?;
  let mailer: Arc<dyn Mailer> = get_native_mailer(&mut cx, mailer)?;
  let oauth_provider_store: Arc<dyn OauthProviderStore> =
    get_native_oauth_provider_store(&mut cx, oauth_provider_store)?;
  let password_service: Arc<dyn PasswordService> = get_native_password(&mut cx, password_service)?;
  let user_store: Arc<dyn UserStore> = get_native_user_store(&mut cx, user_store)?;
  let twinoid_client: Arc<dyn TwinoidClient> = get_native_twinoid_client(&mut cx, twinoid_client)?;
  let twinoid_store: Arc<dyn TwinoidStore> = get_native_twinoid_store(&mut cx, twinoid_store)?;
  let uuid_generator: Arc<dyn UuidGenerator> = get_native_uuid_generator(&mut cx, uuid_generator)?;
  let auth_secret = Context::borrow(&cx, &auth_secret, |auth_secret: Ref<BinaryData>| {
    let auth_secret: &[u8] = auth_secret.as_slice::<u8>();
    auth_secret.to_vec()
  });

  let auth = AuthService::new(
    auth_store,
    clock,
    dinoparc_client,
    dinoparc_store,
    email_formatter,
    hammerfest_client,
    hammerfest_store,
    link_store,
    mailer,
    oauth_provider_store,
    password_service,
    user_store,
    twinoid_client,
    twinoid_store,
    uuid_generator,
    auth_secret,
  );

  let auth: Arc<DynAuthService> = Arc::new(auth);

  let res = async move { auth };

  resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res| Ok(c.boxed(res).upcast()))
}

pub fn authenticate_access_token(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let token_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let inner = get_native_auth_service(&mut cx, inner)?;
  let token: EtwinOauthAccessTokenKey = serde_json::from_str(&token_json.value(&mut cx)).unwrap();

  let res = async move { inner.authenticate_access_token(&token).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn grant_oauth_authorization(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let acx_json = cx.argument::<JsString>(1)?;
  let options_json = cx.argument::<JsString>(2)?;
  let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

  let inner = get_native_auth_service(&mut cx, inner)?;
  let acx: AuthContext = serde_json::from_str(&acx_json.value(&mut cx)).unwrap();
  let options: GrantOauthAuthorizationOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move {
    inner
      .grant_oauth_authorization(&acx, &options)
      .await
      .map_err(|x| Box::new(x) as AnyError)
  };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn create_access_token(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let acx_json = cx.argument::<JsString>(1)?;
  let options_json = cx.argument::<JsString>(2)?;
  let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

  let inner = get_native_auth_service(&mut cx, inner)?;
  let acx: AuthContext = serde_json::from_str(&acx_json.value(&mut cx)).unwrap();
  let options: CreateAccessTokenOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move {
    inner
      .create_access_token(&acx, &options)
      .await
      .map_err(|x| Box::new(x) as AnyError)
  };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn register_or_login_with_email(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let inner = get_native_auth_service(&mut cx, inner)?;
  let options: RegisterOrLoginWithEmailOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.register_or_login_with_email(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn register_with_verified_email(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let inner = get_native_auth_service(&mut cx, inner)?;
  let options: RegisterWithVerifiedEmailOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.register_with_verified_email(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn register_with_username(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let options_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let inner = get_native_auth_service(&mut cx, inner)?;
  let options: RegisterWithUsernameOptions = serde_json::from_str(&options_json.value(&mut cx)).unwrap();

  let res = async move { inner.register_with_username(&options).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn raw_login_with_credentials(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_auth_service(&mut cx, inner)?;
  let credentials_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let credentials: RawUserCredentials = serde_json::from_str(&credentials_json.value(&mut cx)).unwrap();

  let res = async move { inner.raw_login_with_credentials(&credentials).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn register_or_login_with_dinoparc(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_auth_service(&mut cx, inner)?;
  let credentials_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let credentials: DinoparcCredentials = serde_json::from_str(&credentials_json.value(&mut cx)).unwrap();

  let res = async move { inner.register_or_login_with_dinoparc(&credentials).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn register_or_login_with_hammerfest(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_auth_service(&mut cx, inner)?;
  let credentials_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let credentials: HammerfestCredentials = serde_json::from_str(&credentials_json.value(&mut cx)).unwrap();

  let res = async move { inner.register_or_login_with_hammerfest(&credentials).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn register_or_login_with_twinoid_oauth(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_auth_service(&mut cx, inner)?;
  let credentials_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let credentials: RfcOauthAccessTokenKey = serde_json::from_str(&credentials_json.value(&mut cx)).unwrap();

  let res = async move { inner.register_or_login_with_twinoid_oauth(&credentials).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn authenticate_session(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_auth_service(&mut cx, inner)?;
  let credentials_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let credentials: SessionId = serde_json::from_str(&credentials_json.value(&mut cx)).unwrap();

  let res = async move { inner.authenticate_session(credentials).await };
  resolve_callback_serde(&mut cx, res, cb)
}

pub fn raw_authenticate_credentials(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_auth_service(&mut cx, inner)?;
  let credentials_json = cx.argument::<JsString>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let credentials: RawCredentials = serde_json::from_str(&credentials_json.value(&mut cx)).unwrap();

  let res = async move { inner.raw_authenticate_credentials(&credentials).await };
  resolve_callback_serde(&mut cx, res, cb)
}
