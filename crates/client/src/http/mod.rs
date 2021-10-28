mod url;

use crate::http::url::EtwinUrls;
use crate::{EtwinAuth, EtwinClient};
use ::url::Url;
use async_trait::async_trait;
use etwin_core::auth::AuthContext;
use etwin_core::clock::Clock;
use etwin_core::types::AnyError;
use etwin_core::user::{ShortUser, UserId};
use reqwest::{Client, RequestBuilder, Response};
use serde::Serialize;
use std::fmt::Debug;
use std::str::from_utf8;
use std::time::Duration;

const USER_AGENT: &str = "etwin_client";
const TIMEOUT: Duration = Duration::from_millis(5000);

pub struct HttpEternaltwinClient<TyClock> {
  client: Client,
  #[allow(unused)]
  clock: TyClock,
  urls: EtwinUrls,
}

trait RequestBuilderExt {
  fn with_auth(self, auth: &EtwinAuth) -> Result<RequestBuilder, AnyError>;
}

impl RequestBuilderExt for RequestBuilder {
  fn with_auth(self, auth: &EtwinAuth) -> Result<RequestBuilder, AnyError> {
    Ok(match auth {
      EtwinAuth::Guest => self,
      EtwinAuth::Session(_) => todo!(),
      EtwinAuth::Token(token) => self.bearer_auth(token),
      EtwinAuth::Credentials { username, password } => {
        let password = from_utf8(password.0.as_slice())?;
        self.basic_auth(username, Some(password))
      }
    })
  }
}

impl<TyClock> HttpEternaltwinClient<TyClock>
where
  TyClock: Clock,
{
  pub fn new(clock: TyClock, root: Url) -> Result<Self, AnyError> {
    Ok(Self {
      client: Client::builder()
        .user_agent(USER_AGENT)
        .timeout(TIMEOUT)
        .redirect(reqwest::redirect::Policy::none())
        .build()?,
      clock,
      urls: EtwinUrls::new(root),
    })
  }
}

#[async_trait]
impl<TyClock> EtwinClient for HttpEternaltwinClient<TyClock>
where
  TyClock: Clock,
{
  async fn get_self(&self, auth: &EtwinAuth) -> Result<AuthContext, AnyError> {
    let mut builder = self.client.get(self.urls.auth_self());
    builder = builder.with_auth(auth)?;
    let res: Response = builder.send().await?;
    // dbg!(&res);
    let res = res.json::<AuthContext>().await?;
    Ok(res)
  }

  async fn get_user(&self, auth: &EtwinAuth, user_id: UserId) -> Result<ShortUser, AnyError> {
    let mut builder = self.client.get(self.urls.user(user_id));
    builder = builder.with_auth(auth)?;
    let res: Response = builder.send().await?;
    // dbg!(&res);
    let res = res.json::<ShortUser>().await?;
    Ok(res)
  }

  // pub async fn create_session(&self, username: Username, password: Password) -> Result<ShortUser, AnyError> {
  //   let mut url = self.urls.auth_self();
  //   url.query_pairs_mut().append_pair("method", "Etwin");
  //   let mut builder = self.client.put(url);
  //   builder = builder.json(&UserCredentials {
  //     login: username.to_string(),
  //     password: hex::encode(password.0.as_slice()),
  //   });
  //   let res: Response = builder.send().await?;
  //   let res = res.json::<ShortUser>().await?;
  //   Ok(res)
  // }
}

#[derive(Debug, Serialize)]
struct UserCredentials {
  login: String,
  password: String,
}

#[cfg(feature = "neon")]
impl<TyClock> neon::prelude::Finalize for HttpEternaltwinClient<TyClock> where TyClock: Clock {}
