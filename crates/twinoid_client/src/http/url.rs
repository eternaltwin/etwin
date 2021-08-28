use reqwest::Url;

pub struct TwinoidUrls {
  root: Url,
}

impl TwinoidUrls {
  pub fn new() -> Self {
    Self {
      root: Url::parse("https://twinoid.com/graph").expect("failed to parse twinoid root URL"),
    }
  }

  fn make_url(&self, segments: &[&str]) -> Url {
    let mut url = self.root.clone();
    url.path_segments_mut().expect("invalid root url").extend(segments);
    url
  }

  pub fn me(&self) -> Url {
    self.make_url(&["me"])
  }
}
