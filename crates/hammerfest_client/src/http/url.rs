use etwin_core::dns::DnsResolver;
use etwin_core::hammerfest::{HammerfestForumThemeId, HammerfestForumThreadId, HammerfestServer, HammerfestUserId};
use reqwest::Url;
use std::num::NonZeroU16;

pub struct HammerfestUrls {
  root: String,
  host: &'static str,
}

impl HammerfestUrls {
  pub fn new<TyDnsResolver>(dns_resolver: &TyDnsResolver, server: HammerfestServer) -> Self
  where
    TyDnsResolver: DnsResolver<HammerfestServer>,
  {
    let host = match server {
      HammerfestServer::HammerfestFr => "www.hammerfest.fr",
      HammerfestServer::HammerfestEs => "www.hammerfest.es",
      HammerfestServer::HfestNet => "www.hfest.net",
    };
    let root = if let Some(addr) = dns_resolver.resolve4(&server) {
      format!("http://{}", addr)
    } else {
      format!("http://{}", host)
    };
    Self { root, host }
  }

  fn make_url(&self, segments: &[&str]) -> Url {
    let mut url = Url::parse(self.root.as_str()).expect("invalid root url");
    url.path_segments_mut().expect("invalid root url").extend(segments);
    url
  }

  pub fn host(&self) -> &'static str {
    self.host
  }

  pub fn root(&self) -> Url {
    self.make_url(&[])
  }

  pub fn login(&self) -> Url {
    self.make_url(&["login.html"])
  }

  pub fn user(&self, user: &HammerfestUserId) -> Url {
    user.with_str(|s| self.make_url(&["user.html", s]))
  }

  pub fn inventory(&self) -> Url {
    self.make_url(&["user.html", "inventory"])
  }

  pub fn shop(&self) -> Url {
    self.make_url(&["shop.html"])
  }

  pub fn god_children(&self) -> Url {
    self.make_url(&["user.html", "godChildren"])
  }

  pub fn forum_home(&self) -> Url {
    self.make_url(&["forum.html"])
  }

  pub fn forum_theme(&self, theme: HammerfestForumThemeId, page1: NonZeroU16) -> Url {
    let mut url = theme.with_str(|theme| self.make_url(&["forum.html", "theme", theme]));
    url.set_query(Some(&format!("page={}", page1)));
    url
  }

  pub fn forum_thread(&self, thread: HammerfestForumThreadId, page1: NonZeroU16) -> Url {
    let mut url = thread.with_str(|thread| self.make_url(&["forum.html", "thread", thread]));
    url.set_query(Some(&format!("page={}", page1)));
    url
  }
}
