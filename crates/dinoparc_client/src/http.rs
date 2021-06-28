mod errors;
mod locale;
mod scraper;
mod url;

use self::errors::ScraperError;
use crate::http::url::DinoparcUrls;
use ::scraper::Html;
use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::dinoparc::{
  DinoparcClient, DinoparcCollectionResponse, DinoparcCredentials, DinoparcDinozId, DinoparcDinozResponse,
  DinoparcInventoryResponse, DinoparcMachineId, DinoparcServer, DinoparcSession, DinoparcSessionKey,
  DinoparcSessionUser, DinoparcUsername, ShortDinoparcUser,
};
use etwin_core::types::EtwinError;
use md5::{Digest, Md5};
use reqwest::{Client, RequestBuilder, StatusCode};
use serde::Serialize;
use std::error::Error as StdError;
use std::str::FromStr;
use std::time::Duration;

const USER_AGENT: &str = "EtwinDinoparcScraper";
const TIMEOUT: Duration = Duration::from_millis(5000);

pub struct HttpDinoparcClient<TyClock> {
  client: Client,
  clock: TyClock,
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

impl<TyClock> HttpDinoparcClient<TyClock>
where
  TyClock: Clock,
{
  pub fn new(clock: TyClock) -> Result<Self, Box<dyn StdError>> {
    Ok(Self {
      client: Client::builder()
        .user_agent(USER_AGENT)
        .timeout(TIMEOUT)
        .redirect(reqwest::redirect::Policy::none())
        .build()?,
      clock,
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

  let hash = Md5::digest(&username.as_str().as_bytes());
  let hash = hash.as_slice();
  let mut mid = String::with_capacity(DinoparcMachineId::LENGTH);

  for i in 0..DinoparcMachineId::LENGTH {
    let idx = hash[i % hash.len()];
    mid.push(CHARSET[usize::from(idx) % CHARSET.len()]);
  }
  mid.parse().unwrap()
}

#[async_trait]
impl<TyClock> DinoparcClient for HttpDinoparcClient<TyClock>
where
  TyClock: Clock,
{
  async fn create_session(&self, options: &DinoparcCredentials) -> Result<DinoparcSession, EtwinError> {
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
      .await?;

    if res.status() != StatusCode::OK {
      return Err(ScraperError::UnexpectedLoginResponse.into());
    }

    let session_key = res
      .cookies()
      .find(|cookie| cookie.name() == "sid")
      .map(|cookie| cookie.value().to_owned())
      .ok_or(ScraperError::MissingSessionCookie)?;
    let session_key = DinoparcSessionKey::from_str(&session_key).map_err(|_| ScraperError::InvalidSessionCookie)?;

    {
      touch_ad_tracking(&self.client, session_key.clone(), options.server, &options.username).await?;
      confirm_login(&self.client, session_key.clone(), options.server).await?;
    }

    let html = self.get_html(urls.bank(), Some(&session_key)).await?;
    let user = scraper::scrape_bank(&html)?;
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
  ) -> Result<Option<DinoparcSession>, EtwinError> {
    let now = self.clock.now();
    let html = self
      .get_html(DinoparcUrls::new(server).bank(), Some(&session_key))
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

  async fn get_dinoz(
    &self,
    session: &DinoparcSession,
    id: DinoparcDinozId,
  ) -> Result<DinoparcDinozResponse, EtwinError> {
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

  async fn get_inventory(&self, session: &DinoparcSession) -> Result<DinoparcInventoryResponse, EtwinError> {
    let html = self
      .get_html(DinoparcUrls::new(session.user.server).inventory(), Some(&session.key))
      .await?;
    let response = scraper::scrape_inventory(&html)?;
    // TODO: Assert username matches
    Ok(DinoparcInventoryResponse {
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
    })
  }

  async fn get_collection(&self, session: &DinoparcSession) -> Result<DinoparcCollectionResponse, EtwinError> {
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
  let mid = derive_machine_id(&username);
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
impl<TyClock> neon::prelude::Finalize for HttpDinoparcClient<TyClock> where TyClock: Clock {}
