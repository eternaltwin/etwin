use etwin_core::dinoparc::{DinoparcDinozId, DinoparcMachineId, DinoparcServer, DinoparcUserId};
use reqwest::Url;

pub struct DinoparcUrls {
  root: Url,
}

impl DinoparcUrls {
  pub fn new(server: DinoparcServer) -> Self {
    let root = match server {
      DinoparcServer::DinoparcCom => "http://www.dinoparc.com/",
      DinoparcServer::EnDinoparcCom => "http://en.dinoparc.com/",
      DinoparcServer::SpDinoparcCom => "http://sp.dinoparc.com/",
    };
    Self {
      root: Url::parse(root).expect("failed to parse dinoparc root URL"),
    }
  }

  fn make_url(&self, action: &'static str, params: &[(&str, &str)]) -> Url {
    // TODO: Use `?r=...`
    let mut url = self.root.clone();
    {
      let mut query = url.query_pairs_mut();
      query.append_pair("a", action);
      for (k, v) in params.iter().cloned() {
        query.append_pair(k, v);
      }
    }
    url
  }

  // pub fn root(&self) -> Url {
  //   self.root.clone()
  // }

  pub fn bank(&self) -> Url {
    self.make_url("bank", &[])
  }

  pub fn login(&self) -> Url {
    self.make_url("login", &[])
  }

  pub fn inventory(&self) -> Url {
    self.make_url("inventory", &[])
  }

  pub fn collection(&self) -> Url {
    self.make_url("collection", &[])
  }

  // pub fn exchange(&self) -> Url {
  //   self.make_url("bill", &[])
  // }

  pub fn exchange_with(&self, user_id: DinoparcUserId) -> Url {
    user_id.with_str(|user| self.make_url("bill", &[("uid", user)]))
  }

  pub fn dinoz(&self, dinoz_id: DinoparcDinozId) -> Url {
    dinoz_id.with_str(|dinoz| self.make_url("dino", &[("id", dinoz)]))
  }

  pub fn ad_tracking(&self, machine_id: DinoparcMachineId) -> Url {
    self.make_url("adtk", &[("m", machine_id.as_str())])
  }

  pub fn parse_from_root(&self, href: &str) -> Result<Url, url::ParseError> {
    Url::options().base_url(Some(&self.root)).parse(href)
  }
}

/// Value of the `r` query parameter
pub struct DinoparcRequest<'a>(&'a str);

impl<'a> DinoparcRequest<'a> {
  pub fn new(r: &'a str) -> Self {
    Self(r)
  }

  pub fn pairs(&self) -> impl Iterator<Item = (&str, &str)> {
    let r = self.0;
    r.split(';').map(|item| item.split_once('=').unwrap_or((item, "")))
  }
}
