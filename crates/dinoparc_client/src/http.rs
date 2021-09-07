mod errors;
mod locale;
mod scraper;
mod url;

use self::errors::ScraperError;
use crate::http::url::DinoparcUrls;
use ::scraper::Html;
use ::url::Url;
use async_trait::async_trait;
use erased_serde::Serialize as ErasedSerialize;
use etwin_core::clock::Clock;
use etwin_core::dinoparc::{
  DinoparcClient, DinoparcCollectionResponse, DinoparcCredentials, DinoparcDinozId, DinoparcDinozResponse,
  DinoparcExchangeWithResponse, DinoparcInventoryResponse, DinoparcMachineId, DinoparcServer, DinoparcSession,
  DinoparcSessionKey, DinoparcSessionUser, DinoparcUserId, DinoparcUsername, GetExchangeWithError, ShortDinoparcUser,
};
use etwin_core::types::AnyError;
use etwin_log::Logger;
use etwin_serde_tools::{serialize_header_map, serialize_status_code, serialize_url};
use md5::{Digest, Md5};
use reqwest::header::HeaderMap;
use reqwest::{Client, RequestBuilder, Response, StatusCode};
use serde::Serialize;
use std::convert::TryInto;
use std::fmt::Debug;
use std::fs;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

const USER_AGENT: &str = "EtwinDinoparcScraper";
const TIMEOUT: Duration = Duration::from_millis(5000);

struct StderrLogger;

impl<T> Logger<T> for StderrLogger
where
  T: Debug,
{
  fn log(&self, ev: T) {
    eprintln!("{:?}", ev);
  }
}

struct FsLogger<L>
where
  L: for<'r> Logger<&'r dyn Debug>,
{
  dir: PathBuf,
  next_id: AtomicU64,
  fallback_logger: L,
}

impl<'a, L> Logger<HttpEvent<'a>> for FsLogger<L>
where
  L: for<'r> Logger<&'r dyn Debug>,
{
  fn log(&self, ev: HttpEvent<'a>) {
    let id = self.next_id.fetch_add(1, Ordering::Relaxed);
    let dir = self.dir.join(format!("{}-{}", id, ev.target));
    if let Err(e) = fs::create_dir(&dir) {
      return self.fallback_logger.log(&e);
    }
    let meta = match serde_json::to_vec_pretty(&*ev.meta) {
      Ok(meta) => meta,
      Err(e) => return self.fallback_logger.log(&e),
    };
    if let Err(e) = fs::write(dir.join("meta.json"), meta) {
      return self.fallback_logger.log(&e);
    }
    for (i, html) in ev.html.iter().cloned().enumerate() {
      if let Err(e) = fs::write(dir.join(format!("main{}.html", i).as_str()), html) {
        return self.fallback_logger.log(&e);
      }
    }
  }
}

pub struct HttpEvent<'a> {
  target: &'static str,
  html: Vec<&'a [u8]>,
  meta: Box<dyn ErasedSerialize + 'a>,
}

fn take_bytes<'a>(bytes: Option<&'a [u8]>, sink: &mut Vec<&'a [u8]>) -> Option<usize> {
  match bytes {
    Some(b) => {
      let id = sink.len();
      sink.push(b);
      Some(id)
    }
    None => None,
  }
}

fn take_bytesu64<'a>(bytes: Option<&'a [u8]>, sink: &mut Vec<&'a [u8]>) -> Option<u64> {
  take_bytes(bytes, sink).map(|id| id.try_into().unwrap())
}

#[derive(Copy, Clone, Debug)]
pub enum HttpDinoparcClientEvent<'a, Html: 'a> {
  CreateSession(CreateSessionEvent<'a, Html>),
}

impl<'a, Html: 'a> From<CreateSessionEvent<'a, Html>> for HttpDinoparcClientEvent<'a, Html> {
  fn from(ev: CreateSessionEvent<'a, Html>) -> Self {
    Self::CreateSession(ev)
  }
}

impl HttpDinoparcClientEvent<'_, &[u8]> {
  pub fn filter_map<'a>(ev: HttpDinoparcClientEvent<'a, &'a [u8]>) -> Option<HttpEvent<'a>> {
    Some(ev.into())
  }
}

impl<'a> From<HttpDinoparcClientEvent<'a, &'a [u8]>> for HttpEvent<'a> {
  fn from(ev: HttpDinoparcClientEvent<'a, &'a [u8]>) -> Self {
    match ev {
      HttpDinoparcClientEvent::CreateSession(ev) => ev.into(),
    }
  }
}

#[derive(Clone, Debug, Serialize)]
pub struct HttpResponseMeta {
  #[serde(serialize_with = "serialize_url")]
  uri: Url,
  #[serde(serialize_with = "serialize_status_code")]
  status: StatusCode,
  #[serde(serialize_with = "serialize_header_map")]
  headers: HeaderMap,
}

impl<'a> From<&'a Response> for HttpResponseMeta {
  fn from(response: &'a Response) -> Self {
    Self {
      uri: response.url().clone(),
      status: response.status(),
      headers: response.headers().clone(),
    }
  }
}

#[derive(Copy, Clone, Debug, Serialize)]
pub struct CreateSessionEvent<'a, Html: 'a> {
  state: &'static str,
  server: DinoparcServer,
  username: &'a DinoparcUsername,
  error: Option<&'a str>,
  login_response: Option<&'a HttpResponseMeta>,
  bank_response: Option<&'a HttpResponseMeta>,
  bank_html: Option<Html>,
}

impl<'a, Html: 'a> CreateSessionEvent<'a, Html> {
  pub const fn new(server: DinoparcServer, username: &'a DinoparcUsername) -> Self {
    Self {
      state: "new",
      server,
      username,
      error: None,
      login_response: None,
      bank_response: None,
      bank_html: None,
    }
  }
}

impl<'a> From<CreateSessionEvent<'a, &'a [u8]>> for HttpEvent<'a> {
  fn from(ev: CreateSessionEvent<'a, &'a [u8]>) -> Self {
    let mut files: Vec<&'a [u8]> = Vec::new();
    let meta: CreateSessionEvent<'a, u64> = CreateSessionEvent {
      state: ev.state,
      server: ev.server,
      username: ev.username,
      error: ev.error,
      login_response: ev.login_response,
      bank_response: ev.bank_response,
      bank_html: take_bytesu64(ev.bank_html, &mut files),
    };
    HttpEvent {
      target: "create_session",
      html: files,
      meta: Box::new(meta),
    }
  }
}

pub struct HttpDinoparcClient<TyClock, TyLogger> {
  client: Client,
  clock: TyClock,
  logger: TyLogger,
}

trait RequestBuilderExt {
  fn with_session(self, key: Option<DinoparcSessionKey>) -> RequestBuilder;
}

impl RequestBuilderExt for RequestBuilder {
  fn with_session(self, key: Option<DinoparcSessionKey>) -> RequestBuilder {
    if let Some(key) = key {
      // No need to escape, per DinoparcSessionKey invariants.
      let session_cookie = "sid=".to_owned() + key.as_str();
      self.header(reqwest::header::COOKIE, session_cookie)
    } else {
      self
    }
  }
}

impl<TyClock, TyLogger> HttpDinoparcClient<TyClock, TyLogger>
where
  TyClock: Clock,
  TyLogger: for<'r> Logger<HttpDinoparcClientEvent<'r, &'r [u8]>>,
{
  pub fn new(clock: TyClock, logger: TyLogger) -> Result<Self, AnyError> {
    Ok(Self {
      client: Client::builder()
        .user_agent(USER_AGENT)
        .timeout(TIMEOUT)
        .redirect(reqwest::redirect::Policy::none())
        .build()?,
      clock,
      logger,
    })
  }

  async fn get_html(&self, url: reqwest::Url, session: Option<&DinoparcSessionKey>) -> reqwest::Result<Html> {
    let mut builder = self.client.get(url);

    if let Some(key) = session {
      // No need to escape, per DinoparcSessionKey invariants.
      let session_cookie = "sid=".to_owned() + key.as_str();
      builder = builder.header(reqwest::header::COOKIE, session_cookie);
    }

    let resp = builder.send().await?;
    let text = resp.error_for_status()?.text().await?;
    Ok(Html::parse_document(&text))
  }
}

fn derive_machine_id(username: &DinoparcUsername) -> DinoparcMachineId {
  const CHARSET: [char; 62] = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  ];

  let hash = Md5::digest(username.as_str().as_bytes());
  let hash = hash.as_slice();
  let mut mid = String::with_capacity(DinoparcMachineId::LENGTH);

  for i in 0..DinoparcMachineId::LENGTH {
    let idx = hash[i % hash.len()];
    mid.push(CHARSET[usize::from(idx) % CHARSET.len()]);
  }
  mid.parse().unwrap()
}

#[async_trait]
impl<TyClock, TyLogger> DinoparcClient for HttpDinoparcClient<TyClock, TyLogger>
where
  TyClock: Clock,
  TyLogger: for<'r> Logger<HttpDinoparcClientEvent<'r, &'r [u8]>>,
{
  async fn get_preferred_exchange_with(&self, server: DinoparcServer) -> [DinoparcUserId; 2] {
    match server {
      DinoparcServer::DinoparcCom => ["71".parse().unwrap(), "72".parse().unwrap()],
      DinoparcServer::EnDinoparcCom => ["1".parse().unwrap(), "2".parse().unwrap()],
      DinoparcServer::SpDinoparcCom => ["2".parse().unwrap(), "1".parse().unwrap()],
    }
  }

  async fn create_session(&self, options: &DinoparcCredentials) -> Result<DinoparcSession, AnyError> {
    let logger = &self.logger;
    let mut event: CreateSessionEvent<&[u8]> = CreateSessionEvent::new(options.server, &options.username);

    #[derive(Serialize)]
    struct LoginForm<'a> {
      login: &'a str,
      pass: &'a str,
    }
    let urls = DinoparcUrls::new(options.server);

    let now = self.clock.now();
    let res = self
      .client
      .post(urls.login())
      .form(&LoginForm {
        login: options.username.as_str(),
        pass: options.password.as_str(),
      })
      .send()
      .await
      .log_on_err(event, logger)?;
    event.state = "login_response";
    let login_res_meta = HttpResponseMeta::from(&res);
    event.login_response = Some(&login_res_meta);

    if res.status() != StatusCode::OK {
      return Err(ScraperError::UnexpectedLoginResponse.into()).log_on_err(event, logger);
    }
    event.state = "login_response_ok";

    let session_key = res
      .cookies()
      .find(|cookie| cookie.name() == "sid")
      .map(|cookie| cookie.value().to_owned())
      .ok_or(ScraperError::MissingSessionCookie)
      .log_on_err(event, logger)?;
    event.state = "login_session_key_found";
    let session_key = DinoparcSessionKey::from_str(&session_key)
      .map_err(|_| ScraperError::InvalidSessionCookie)
      .log_on_err(event, logger)?;
    event.state = "login_session_key_ok";

    {
      touch_ad_tracking(&self.client, session_key.clone(), options.server, &options.username).await?;
      event.state = "login_touched_ad_tracking";
      confirm_login(&self.client, session_key.clone(), options.server).await?;
      event.state = "login_confirm_login";
    }

    let mut builder = self.client.get(urls.bank());

    // No need to escape, per DinoparcSessionKey invariants.
    let session_cookie = "sid=".to_owned() + session_key.as_str();
    builder = builder.header(reqwest::header::COOKIE, session_cookie);

    let resp = builder.send().await.log_on_err(event, logger)?;
    event.state = "login_bank_response";
    let bank_res_meta = HttpResponseMeta::from(&resp);
    event.bank_response = Some(&bank_res_meta);
    if resp.status() == StatusCode::FOUND {
      // Redirected: it means we are _not_ logged in
      return Err(ScraperError::InvalidCredentials(options.server, options.username.clone()).into())
        .log_on_err(event, logger);
    }
    let text = resp.error_for_status()?.text().await.log_on_err(event, logger)?;
    event.bank_html = Some(text.as_bytes());
    let html = Html::parse_document(&text);
    event.state = "login_bank_html";

    let user = scraper::scrape_bank(&html).log_on_err(event, logger)?;
    event.state = "login_scraped_bank";
    Ok(DinoparcSession {
      ctime: now,
      atime: now,
      key: session_key,
      user: ShortDinoparcUser {
        server: user.context.server,
        id: user.user_id,
        username: user.context.auth.username,
      },
    })
  }

  async fn test_session(
    &self,
    server: DinoparcServer,
    session_key: &DinoparcSessionKey,
  ) -> Result<Option<DinoparcSession>, AnyError> {
    let now = self.clock.now();
    let html = self
      .get_html(DinoparcUrls::new(server).bank(), Some(session_key))
      .await?;
    let user = scraper::scrape_bank(&html)?;
    Ok(Some(DinoparcSession {
      ctime: now,
      atime: now,
      key: session_key.clone(),
      user: ShortDinoparcUser {
        server: user.context.server,
        id: user.user_id,
        username: user.context.auth.username,
      },
    }))
  }

  async fn get_dinoz(&self, session: &DinoparcSession, id: DinoparcDinozId) -> Result<DinoparcDinozResponse, AnyError> {
    let html = self
      .get_html(DinoparcUrls::new(session.user.server).dinoz(id), Some(&session.key))
      .await?;
    let response = scraper::scrape_dinoz(&html)?;
    // TODO: Assert username matches
    Ok(DinoparcDinozResponse {
      session_user: DinoparcSessionUser {
        user: ShortDinoparcUser {
          server: session.user.server,
          id: session.user.id,
          username: response.session_user.user,
        },
        coins: response.session_user.coins,
        dinoz: response.session_user.dinoz,
      },
      dinoz: response.dinoz,
    })
  }

  async fn get_exchange_with(
    &self,
    session: &DinoparcSession,
    other_user: DinoparcUserId,
  ) -> Result<DinoparcExchangeWithResponse, AnyError> {
    if other_user == session.user.id {
      return Err(Box::new(GetExchangeWithError::SelfExchange));
    }

    let html = self
      .get_html(
        DinoparcUrls::new(session.user.server).exchange_with(other_user),
        Some(&session.key),
      )
      .await?;
    let response = scraper::scrape_exchange_with(&html)?;
    // TODO: Assert username matches
    Ok(DinoparcExchangeWithResponse {
      session_user: DinoparcSessionUser {
        user: ShortDinoparcUser {
          server: session.user.server,
          id: session.user.id,
          username: response.session_user.user,
        },
        coins: response.session_user.coins,
        dinoz: response.session_user.dinoz,
      },
      own_bills: response.own_bills,
      own_dinoz: response.own_dinoz,
      other_user: response.other_user,
      other_dinoz: response.other_dinoz,
    })
  }

  async fn get_inventory(&self, session: &DinoparcSession) -> Result<DinoparcInventoryResponse, AnyError> {
    let uri = DinoparcUrls::new(session.user.server).inventory();

    let mut builder = self.client.get(uri.clone());
    {
      // No need to escape, per DinoparcSessionKey invariants.
      let session_cookie = "sid=".to_owned() + session.key.as_str();
      builder = builder.header(reqwest::header::COOKIE, session_cookie);
    }

    let resp = builder.send().await?;
    let text = resp.error_for_status()?.text().await?;
    let text = text.as_str();
    let html = Html::parse_document(text);
    let result = scraper::scrape_inventory(&html).map(|response| DinoparcInventoryResponse {
      // TODO: Assert username matches
      session_user: DinoparcSessionUser {
        user: ShortDinoparcUser {
          server: session.user.server,
          id: session.user.id,
          username: response.session_user.user,
        },
        coins: response.session_user.coins,
        dinoz: response.session_user.dinoz,
      },
      inventory: response.inventory,
    });
    // self.logger.log(GetInventoryLogEvent::Complete(session, &result));
    let res = result?;
    // logger.event("got_result", ());
    // let response = result?;
    Ok(res)
  }

  async fn get_collection(&self, session: &DinoparcSession) -> Result<DinoparcCollectionResponse, AnyError> {
    let html = self
      .get_html(DinoparcUrls::new(session.user.server).collection(), Some(&session.key))
      .await?;
    let response = scraper::scrape_collection(&html)?;
    // TODO: Assert username matches
    Ok(DinoparcCollectionResponse {
      session_user: DinoparcSessionUser {
        user: ShortDinoparcUser {
          server: session.user.server,
          id: session.user.id,
          username: response.session_user.user,
        },
        coins: response.session_user.coins,
        dinoz: response.session_user.dinoz,
      },
      collection: response.collection,
    })
  }
}

async fn touch_ad_tracking(
  client: &Client,
  session: DinoparcSessionKey,
  server: DinoparcServer,
  username: &DinoparcUsername,
) -> Result<(), ScraperError> {
  let mid = derive_machine_id(username);
  let res = client
    .get(DinoparcUrls::new(server).ad_tracking(mid))
    .with_session(Some(session))
    .send()
    .await?;

  if res.status() == StatusCode::OK && res.text().await? == "OK" {
    Ok(())
  } else {
    Err(ScraperError::UnexpectedAdTrackingResponse)
  }
}

async fn confirm_login(
  client: &Client,
  session: DinoparcSessionKey,
  server: DinoparcServer,
) -> Result<(), ScraperError> {
  let res = client
    .get(DinoparcUrls::new(server).login())
    .with_session(Some(session))
    .send()
    .await?;

  let status = res.status();
  if status == StatusCode::OK || status == StatusCode::FOUND {
    Ok(())
  } else {
    Err(ScraperError::UnexpectedLoginConfirmationResponse(status))
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyLogger> neon::prelude::Finalize for HttpDinoparcClient<TyClock, TyLogger>
where
  TyClock: Clock,
  TyLogger: for<'r> Logger<HttpDinoparcClientEvent<'r, &'r [u8]>>,
{
}

pub trait ResultExt {
  fn log_on_err<'a, L: ?Sized + for<'r> Logger<HttpDinoparcClientEvent<'r, &'r [u8]>>>(
    self,
    event: CreateSessionEvent<'a, &'a [u8]>,
    logger: &L,
  ) -> Self;
}

impl<Ok, Err: Debug> ResultExt for Result<Ok, Err> {
  fn log_on_err<'a, L: ?Sized + for<'r> Logger<HttpDinoparcClientEvent<'r, &'r [u8]>>>(
    self,
    event: CreateSessionEvent<'a, &'a [u8]>,
    logger: &L,
  ) -> Self {
    match self {
      Self::Ok(ok) => Self::Ok(ok),
      Self::Err(e) => {
        let err_msg = format!("{:?}", &e);
        let mut ev = event;
        ev.error = Some(err_msg.as_str());
        logger.log(ev.into());
        Self::Err(e)
      }
    }
  }
}
