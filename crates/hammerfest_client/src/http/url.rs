use etwin_core::hammerfest::{HammerfestForumThemeId, HammerfestForumThreadId, HammerfestServer, HammerfestUserId};
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

  pub fn shop(&self) -> Url {
    self.make_url(&["shop.html"])
  }

  pub fn god_children(&self) -> Url {
    self.make_url(&["user.html", "godChildren"])
  }

  pub fn forum_home(&self) -> Url {
    self.make_url(&["forum.html"])
  }

  pub fn forum_theme(&self, theme: HammerfestForumThemeId, page1: u32) -> Url {
    let mut url = theme.with_str(|theme| self.make_url(&["forum.html", "theme", theme]));
    url.set_query(Some(&format!("page={}", page1)));
    url
  }

  pub fn forum_thread(&self, thread: HammerfestForumThreadId, page1: u32) -> Url {
    let mut url = thread.with_str(|thread| self.make_url(&["forum.html", "thread", thread]));
    url.set_query(Some(&format!("page={}", page1)));
    url
  }
}
