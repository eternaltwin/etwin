use etwin_core::hammerfest::{HammerfestServer, HammerfestUserId};
use reqwest::Url;

pub struct HammerfestUrls {
  root: &'static str,
}

impl HammerfestUrls {
  pub fn new(server: HammerfestServer) -> Self {
    HammerfestUrls {
      root: match server {
        HammerfestServer::HammerfestFr => "http://www.hammerfest.fr",
        HammerfestServer::HammerfestEs => "http://www.hammerfest.es",
        HammerfestServer::HfestNet => "http://www.hfest.net",
      },
    }
  }

  fn make_url(&self, segments: &[&str]) -> Url {
    let mut url = Url::parse(self.root).expect("invalid root url");
    url.path_segments_mut().expect("invalid root url").extend(segments);
    url
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
}
