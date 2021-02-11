use etwin_core::dinoparc::{DinoparcMachineId, DinoparcServer};
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

  pub fn ad_tracking(&self, machine_id: DinoparcMachineId) -> Url {
    self.make_url("adtk", &[("m", machine_id.as_str())])
  }
}
