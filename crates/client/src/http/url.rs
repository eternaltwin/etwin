use etwin_core::user::UserId;
use reqwest::Url;

pub struct EtwinUrls {
  root: Url,
}

impl EtwinUrls {
  pub fn new(root: Url) -> Self {
    Self { root }
  }

  fn make_url(&self, segments: &[&str]) -> Url {
    let mut url = self.root.clone();
    url
      .path_segments_mut()
      .expect("invalid etwin root url")
      .extend(segments);
    url
  }

  pub fn auth_self(&self) -> Url {
    self.make_url(&["api", "v1", "auth", "self"])
  }

  pub fn user(&self, user_id: UserId) -> Url {
    self.make_url(&["api", "v1", "users", user_id.to_hex().as_str()])
  }
}
