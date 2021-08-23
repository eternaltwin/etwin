use etwin_core::dinorpg::{DinorpgServer, DinorpgUserId};
use reqwest::Url;

pub struct DinorpgUrls {
  root: Url,
}

impl DinorpgUrls {
  pub fn new(server: DinorpgServer) -> Self {
    let root = match server {
      DinorpgServer::DinorpgCom => "http://www.dinorpg.com/",
      DinorpgServer::EnDinorpgCom => "http://en.dinorpg.com/",
      DinorpgServer::EsDinorpgCom => "http://es.dinorpg.com/",
    };
    Self {
      root: Url::parse(root).expect("failed to parse popotamo root URL"),
    }
  }

  fn make_url(&self, segments: &[&str]) -> Url {
    let mut url = self.root.clone();
    url.path_segments_mut().expect("invalid root url").extend(segments);
    url
  }

  pub fn user(&self, user_id: DinorpgUserId) -> Url {
    user_id.with_str(|user_id| self.make_url(&["user", user_id]))
  }

  #[allow(unused)]
  pub fn parse_from_root(&self, href: &str) -> Result<Url, url::ParseError> {
    Url::options().base_url(Some(&self.root)).parse(href)
  }
}
