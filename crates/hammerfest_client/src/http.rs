mod errors;
mod scraper;
#[cfg(test)]
mod tests;
mod url;

use self::errors::ScraperError;
use self::url::HammerfestUrls;
use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::dns::DnsResolver;
use etwin_core::hammerfest::*;
use etwin_core::types::AnyError;
pub use etwin_mt_dns::MtDnsResolver;
use reqwest::{Client, StatusCode};
use serde::Serialize;
use std::num::NonZeroU16;
use std::str::FromStr;
use std::time::Duration;

type Result<T> = std::result::Result<T, AnyError>;

const USER_AGENT: &str = "EtwinHammerfestScraper";
const TIMEOUT: Duration = Duration::from_millis(5000);

pub struct HttpHammerfestClient<TyClock, TyDnsResolver> {
  client: Client,
  clock: TyClock,
  dns_resolver: TyDnsResolver,
}

impl<TyClock> HttpHammerfestClient<TyClock, MtDnsResolver>
where
  TyClock: Clock,
{
  pub fn new(clock: TyClock) -> Result<Self> {
    Ok(Self {
      client: Client::builder()
        .user_agent(USER_AGENT)
        .timeout(TIMEOUT)
        .redirect(reqwest::redirect::Policy::none())
        .build()?,
      clock,
      dns_resolver: MtDnsResolver,
    })
  }
}

impl<TyClock, TyDnsResolver> HttpHammerfestClient<TyClock, TyDnsResolver>
where
  TyClock: Clock,
  TyDnsResolver: DnsResolver<HammerfestServer>,
{
  pub fn new_with_resolver(clock: TyClock, dns_resolver: TyDnsResolver) -> Result<Self> {
    Ok(Self {
      client: Client::builder()
        .user_agent(USER_AGENT)
        .timeout(TIMEOUT)
        .redirect(reqwest::redirect::Policy::none())
        .build()?,
      clock,
      dns_resolver,
    })
  }

  async fn get_html(
    &self,
    host: &str,
    url: reqwest::Url,
    session: Option<&HammerfestSessionKey>,
  ) -> reqwest::Result<scraper::Html> {
    let mut builder = self.client.get(url);

    if let Some(key) = session {
      // No need to escape, per HammerfestSessionKey invariants.
      let session_cookie = "SID=".to_owned() + key.as_str();
      builder = builder.header(reqwest::header::COOKIE, session_cookie);
    }

    let resp = builder.header(reqwest::header::HOST, host).send().await?;
    let text = resp.error_for_status()?.text().await?;
    Ok(scraper::Html::parse_document(&text))
  }
}

#[async_trait]
impl<TyClock, TyDnsResolver> HammerfestClient for HttpHammerfestClient<TyClock, TyDnsResolver>
where
  TyClock: Clock,
  TyDnsResolver: DnsResolver<HammerfestServer>,
{
  async fn create_session(&self, options: &HammerfestCredentials) -> Result<HammerfestSession> {
    #[derive(Serialize)]
    struct LoginForm<'a> {
      login: &'a str,
      pass: &'a str,
    }

    let urls = HammerfestUrls::new(&self.dns_resolver, options.server);

    let now = self.clock.now();
    let resp = self
      .client
      .post(urls.login())
      .form(&LoginForm {
        login: options.username.as_str(),
        pass: options.password.as_str(),
      })
      .header(reqwest::header::HOST, urls.host())
      .send()
      .await?;

    if resp.status() != StatusCode::FOUND {
      let text = resp.error_for_status()?.text().await?;
      let html = scraper::Html::parse_document(&text);
      return Err(
        if scraper::is_login_page_error(&html) {
          ScraperError::InvalidCredentials(options.server, options.username.clone())
        } else {
          ScraperError::UnexpectedResponse(urls.login())
        }
        .into(),
      );
    }

    let session_key = resp
      .cookies()
      .find(|cookie| cookie.name() == "SID")
      .map(|cookie| cookie.value().to_owned())
      .ok_or(ScraperError::MissingSessionCookie)?;
    let session_key = HammerfestSessionKey::from_str(&session_key).map_err(|_| ScraperError::InvalidSessionCookie)?;

    let html = self.get_html(urls.host(), urls.root(), Some(&session_key)).await?;
    let session =
      scraper::scrape_session(html.root_element(), options.server)?.ok_or(ScraperError::LoginSessionRevoked)?;
    Ok(HammerfestSession {
      ctime: now,
      atime: now,
      key: session_key,
      user: session.user,
    })
  }

  async fn test_session(
    &self,
    server: HammerfestServer,
    key: &HammerfestSessionKey,
  ) -> Result<Option<HammerfestSession>> {
    let urls = HammerfestUrls::new(&self.dns_resolver, server);
    let now = self.clock.now();
    let html = self.get_html(urls.host(), urls.root(), Some(key)).await?;
    let session = scraper::scrape_session(html.root_element(), server)?;
    Ok(session.map(|s| HammerfestSession {
      ctime: now,
      atime: now,
      key: key.clone(),
      user: s.user,
    }))
  }

  async fn get_profile_by_id(
    &self,
    session: Option<&HammerfestSession>,
    options: &HammerfestGetProfileByIdOptions,
  ) -> Result<HammerfestProfileResponse> {
    let urls = HammerfestUrls::new(&self.dns_resolver, options.server);
    let html = self
      .get_html(urls.host(), urls.user(&options.user_id), session.map(|sess| &sess.key))
      .await?;
    Ok(scraper::scrape_user_profile(options.server, options.user_id, &html)?)
  }

  async fn get_own_items(&self, session: &HammerfestSession) -> Result<HammerfestInventoryResponse> {
    let urls = HammerfestUrls::new(&self.dns_resolver, session.user.server);
    let html = self.get_html(urls.host(), urls.inventory(), Some(&session.key)).await?;
    Ok(scraper::scrape_user_inventory(&html)?)
  }

  async fn get_own_godchildren(&self, session: &HammerfestSession) -> Result<HammerfestGodchildrenResponse> {
    let server = session.user.server;
    let urls = HammerfestUrls::new(&self.dns_resolver, server);
    let html = self
      .get_html(urls.host(), urls.god_children(), Some(&session.key))
      .await?;
    Ok(scraper::scrape_user_god_children(server, &html)?)
  }

  async fn get_own_shop(&self, session: &HammerfestSession) -> Result<HammerfestShopResponse> {
    let urls = HammerfestUrls::new(&self.dns_resolver, session.user.server);
    let html = self.get_html(urls.host(), urls.shop(), Some(&session.key)).await?;
    Ok(scraper::scrape_user_shop(&html)?)
  }

  async fn get_forum_themes(
    &self,
    session: Option<&HammerfestSession>,
    server: HammerfestServer,
  ) -> Result<HammerfestForumHomeResponse> {
    let urls = HammerfestUrls::new(&self.dns_resolver, server);
    let html = self
      .get_html(urls.host(), urls.forum_home(), session.map(|sess| &sess.key))
      .await?;
    Ok(scraper::scrape_forum_home(server, &html)?)
  }

  async fn get_forum_theme_page(
    &self,
    session: Option<&HammerfestSession>,
    server: HammerfestServer,
    theme_id: HammerfestForumThemeId,
    page1: NonZeroU16,
  ) -> Result<HammerfestForumThemePageResponse> {
    let urls = HammerfestUrls::new(&self.dns_resolver, server);
    let html = self
      .get_html(
        urls.host(),
        urls.forum_theme(theme_id, page1),
        session.map(|sess| &sess.key),
      )
      .await?;
    Ok(scraper::scrape_forum_theme(server, &html)?)
  }

  async fn get_forum_thread_page(
    &self,
    session: Option<&HammerfestSession>,
    server: HammerfestServer,
    thread_id: HammerfestForumThreadId,
    page1: NonZeroU16,
  ) -> Result<HammerfestForumThreadPageResponse> {
    let urls = HammerfestUrls::new(&self.dns_resolver, server);
    let html = self
      .get_html(
        urls.host(),
        urls.forum_thread(thread_id, page1),
        session.map(|sess| &sess.key),
      )
      .await?;
    Ok(scraper::scrape_forum_thread(server, thread_id, &html)?)
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyDnsResolver> neon::prelude::Finalize for HttpHammerfestClient<TyClock, TyDnsResolver>
where
  TyClock: Clock,
  TyDnsResolver: DnsResolver<HammerfestServer>,
{
}
