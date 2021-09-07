mod errors;
mod url;

use crate::http::url::TwinoidUrls;
use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::core::HtmlFragment;
use etwin_core::twinoid::{api, TwinoidUserDisplayName};
use etwin_core::twinoid::{TwinoidApiAuth, TwinoidClient};
use etwin_core::types::AnyError;
use reqwest::Client;
use std::time::Duration;

const USER_AGENT: &str = "EtwinTwinoidClient";
const TIMEOUT: Duration = Duration::from_millis(5000);

pub struct HttpTwinoidClient<TyClock> {
  client: Client,
  #[allow(unused)]
  clock: TyClock,
}

impl<TyClock> HttpTwinoidClient<TyClock>
where
  TyClock: Clock,
{
  pub fn new(clock: TyClock) -> Result<Self, AnyError> {
    Ok(Self {
      client: Client::builder()
        .user_agent(USER_AGENT)
        .timeout(TIMEOUT)
        .redirect(reqwest::redirect::Policy::none())
        .build()?,
      clock,
    })
  }
}

#[async_trait]
impl<TyClock> TwinoidClient for HttpTwinoidClient<TyClock>
where
  TyClock: Clock,
{
  async fn get_me<Query: api::UserQuery>(
    &self,
    auth: TwinoidApiAuth,
    query: &Query,
  ) -> Result<Query::Output, AnyError> {
    let mut url = TwinoidUrls::new().me();
    {
      let mut qs = url.query_pairs_mut();
      if let TwinoidApiAuth::Token(ref token) = &auth {
        qs.append_pair("access_token", token.as_str());
      };
      qs.append_pair("fields", query.to_fields().as_ref());
    }

    let req = self.client.get(url);
    let res = req.send().await?;

    let body = res.bytes().await?;

    match serde_json::from_slice::<Query::Output>(&body) {
      Ok(res) => Ok(res),
      Err(_e) => {
        // TODO: Handle errors such as `{"error":"invalid_token"}`
        let body = String::from_utf8_lossy(body.as_ref());
        Err(body.as_ref().into())
      }
    }
  }

  async fn get_me_short(
    &self,
    auth: TwinoidApiAuth,
  ) -> Result<api::User<TwinoidUserDisplayName, HtmlFragment>, AnyError> {
    self.get_me(auth, &api::ConstUserQuery::<true, true>).await
  }
}

#[cfg(feature = "neon")]
impl<TyClock> neon::prelude::Finalize for HttpTwinoidClient<TyClock> where TyClock: Clock {}
