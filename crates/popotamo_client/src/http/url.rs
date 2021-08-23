use etwin_core::popotamo::{PopotamoServer, PopotamoUserId};
use reqwest::Url;

pub struct PopotamoUrls {
  root: Url,
}

impl PopotamoUrls {
  pub fn new(server: PopotamoServer) -> Self {
    let root = match server {
      PopotamoServer::PopotamoCom => "http://www.popotamo.com/",
      // PopotamoServer::EnDinoparcCom => "http://en.dinoparc.com/",
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

  pub fn user(&self, user_id: PopotamoUserId) -> Url {
    user_id.with_str(|user_id| self.make_url(&["user", user_id]))
  }

  pub fn parse_from_root(&self, href: &str) -> Result<Url, url::ParseError> {
    Url::options().base_url(Some(&self.root)).parse(href)
  }
}
