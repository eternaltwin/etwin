use etwin_core::auth::{AuthContext, AuthScope, GuestAuthContext};
use etwin_core::dinoparc::{
  DinoparcDinozId, DinoparcServer, DinoparcUserId, EtwinDinoparcDinoz, EtwinDinoparcUser, GetDinoparcDinozOptions,
  GetDinoparcUserOptions,
};
use etwin_core::hammerfest::{GetHammerfestUserOptions, HammerfestServer, HammerfestUser, HammerfestUserId};
use etwin_core::types::AnyError;
use etwin_services::dinoparc::DynDinoparcService;
use etwin_services::hammerfest::DynHammerfestService;
pub use serde::Serialize;
use std::sync::Arc;
use warp::filters::BoxedFilter;
use warp::http::StatusCode;
use warp::reject::Reject;
use warp::reply::{Json, WithStatus};
use warp::{Filter, Rejection};

#[derive(Debug)]
struct ServerError(AnyError);

impl Reject for ServerError {}

#[derive(Clone)]
pub struct RouterApi {
  pub dinoparc: Arc<DynDinoparcService>,
  pub hammerfest: Arc<DynHammerfestService>,
}

pub type RestFilter = BoxedFilter<(WithStatus<Json>,)>;

pub fn create_rest_filter(api: RouterApi) -> RestFilter {
  warp::path("archive").and(create_archive_filter(api)).boxed()
}

pub fn create_archive_filter(api: RouterApi) -> RestFilter {
  let dinoparc = warp::path("dinoparc").and(create_archive_dinoparc_filter(api.clone()));
  let hammerfest = warp::path("hammerfest").and(create_archive_hammerfest_filter(api));
  dinoparc.or(hammerfest).unify().boxed()
}

pub fn create_archive_dinoparc_filter(api: RouterApi) -> RestFilter {
  let get_user = {
    #[derive(Copy, Clone, Debug, Serialize)]
    #[serde(tag = "error")]
    enum GetDinoparcUserError {
      DinoparcUserNotFound,
      InternalServerError,
    }

    impl GetDinoparcUserError {
      pub fn get_status_code(self) -> StatusCode {
        match self {
          Self::DinoparcUserNotFound => StatusCode::NOT_FOUND,
          Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
      }
    }

    async fn handle_get_user(
      dinoparc: &DynDinoparcService,
      server: DinoparcServer,
      id: DinoparcUserId,
    ) -> Result<EtwinDinoparcUser, GetDinoparcUserError> {
      let acx = AuthContext::Guest(GuestAuthContext {
        scope: AuthScope::Default,
      });
      match dinoparc
        .get_user(&acx, &GetDinoparcUserOptions { server, id, time: None })
        .await
      {
        Ok(Some(user)) => Ok(user),
        Ok(None) => Err(GetDinoparcUserError::DinoparcUserNotFound),
        Err(_) => Err(GetDinoparcUserError::InternalServerError),
      }
    }

    let api = api.clone();
    warp::path!(DinoparcServer / "users" / DinoparcUserId)
      .and_then(move |server: DinoparcServer, id: DinoparcUserId| {
        let dinoparc = Arc::clone(&api.dinoparc);
        async move {
          let res = handle_get_user(&dinoparc, server, id).await;
          let reply = match res {
            Ok(user) => warp::reply::with_status(warp::reply::json(&user), StatusCode::OK),
            Err(e) => warp::reply::with_status(warp::reply::json(&e), e.get_status_code()),
          };
          Ok::<_, Rejection>(reply)
        }
      })
      .boxed()
  };

  let get_dinoz = {
    #[derive(Copy, Clone, Debug, Serialize)]
    #[serde(tag = "error")]
    enum GetDinoparcDinozError {
      DinoparcDinozNotFound,
      InternalServerError,
    }

    impl GetDinoparcDinozError {
      pub fn get_status_code(self) -> StatusCode {
        match self {
          Self::DinoparcDinozNotFound => StatusCode::NOT_FOUND,
          Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
      }
    }

    async fn handle_get_dinoz(
      dinoparc: &DynDinoparcService,
      server: DinoparcServer,
      id: DinoparcDinozId,
    ) -> Result<EtwinDinoparcDinoz, GetDinoparcDinozError> {
      let acx = AuthContext::Guest(GuestAuthContext {
        scope: AuthScope::Default,
      });
      match dinoparc
        .get_dinoz(&acx, &GetDinoparcDinozOptions { server, id, time: None })
        .await
      {
        Ok(Some(user)) => Ok(user),
        Ok(None) => Err(GetDinoparcDinozError::DinoparcDinozNotFound),
        Err(_) => Err(GetDinoparcDinozError::InternalServerError),
      }
    }

    // let api = api.clone();
    warp::path!(DinoparcServer / "dinoz" / DinoparcDinozId)
      .and_then(move |server: DinoparcServer, id: DinoparcDinozId| {
        let dinoparc = Arc::clone(&api.dinoparc);
        async move {
          let res = handle_get_dinoz(&dinoparc, server, id).await;
          let reply = match res {
            Ok(dinoz) => warp::reply::with_status(warp::reply::json(&dinoz), StatusCode::OK),
            Err(e) => warp::reply::with_status(warp::reply::json(&e), e.get_status_code()),
          };
          Ok::<_, Rejection>(reply)
        }
      })
      .boxed()
  };

  get_user.or(get_dinoz).unify().boxed()
}

pub fn create_archive_hammerfest_filter(api: RouterApi) -> RestFilter {
  let get_user = {
    #[derive(Copy, Clone, Debug, Serialize)]
    #[serde(tag = "error")]
    enum GetHammerfestUserError {
      HammerfestUserNotFound,
      InternalServerError,
    }

    impl GetHammerfestUserError {
      pub fn get_status_code(self) -> StatusCode {
        match self {
          Self::HammerfestUserNotFound => StatusCode::NOT_FOUND,
          Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
      }
    }

    async fn handle_get_user(
      hammerfest: &DynHammerfestService,
      server: HammerfestServer,
      id: HammerfestUserId,
    ) -> Result<HammerfestUser, GetHammerfestUserError> {
      let acx = AuthContext::Guest(GuestAuthContext {
        scope: AuthScope::Default,
      });
      match hammerfest
        .get_user(&acx, &GetHammerfestUserOptions { server, id, time: None })
        .await
      {
        Ok(Some(user)) => Ok(user),
        Ok(None) => Err(GetHammerfestUserError::HammerfestUserNotFound),
        Err(_) => Err(GetHammerfestUserError::InternalServerError),
      }
    }

    // let api = api.clone();
    warp::path!(HammerfestServer / "users" / HammerfestUserId)
      .and_then(move |server: HammerfestServer, id: HammerfestUserId| {
        let hammerfest = Arc::clone(&api.hammerfest);
        async move {
          let res = handle_get_user(&hammerfest, server, id).await;
          let reply = match res {
            Ok(user) => warp::reply::with_status(warp::reply::json(&user), StatusCode::OK),
            Err(e) => warp::reply::with_status(warp::reply::json(&e), e.get_status_code()),
          };
          Ok::<_, Rejection>(reply)
        }
      })
      .boxed()
  };

  get_user.boxed()
}

#[cfg(test)]
mod test {
  use crate::{create_archive_dinoparc_filter, create_rest_filter, RouterApi};
  use etwin_core::clock::VirtualClock;
  use etwin_core::core::Instant;
  use etwin_core::dinoparc::DinoparcStore;
  use etwin_core::hammerfest::{HammerfestClient, HammerfestStore};
  use etwin_core::link::LinkStore;
  use etwin_core::user::UserStore;
  use etwin_core::uuid::Uuid4Generator;
  use etwin_dinoparc_store::mem::MemDinoparcStore;
  use etwin_hammerfest_client::MemHammerfestClient;
  use etwin_hammerfest_store::mem::MemHammerfestStore;
  use etwin_link_store::mem::MemLinkStore;
  use etwin_services::dinoparc::DinoparcService;
  use etwin_services::hammerfest::HammerfestService;
  use etwin_user_store::mem::MemUserStore;
  use std::sync::Arc;

  fn create_api() -> RouterApi {
    let clock = Arc::new(VirtualClock::new(Instant::ymd_hms(2020, 1, 1, 0, 0, 0)));
    let hammerfest_client: Arc<dyn HammerfestClient> = Arc::new(MemHammerfestClient::new(Arc::clone(&clock)));
    let hammerfest_store: Arc<dyn HammerfestStore> = Arc::new(MemHammerfestStore::new(Arc::clone(&clock)));
    let dinoparc_store: Arc<dyn DinoparcStore> = Arc::new(MemDinoparcStore::new(Arc::clone(&clock)));
    let link_store: Arc<dyn LinkStore> = Arc::new(MemLinkStore::new(Arc::clone(&clock)));
    let user_store: Arc<dyn UserStore> = Arc::new(MemUserStore::new(Arc::clone(&clock), Uuid4Generator));

    let dinoparc = Arc::new(DinoparcService::new(
      dinoparc_store,
      Arc::clone(&link_store),
      Arc::clone(&user_store),
    ));

    let hammerfest = Arc::new(HammerfestService::new(
      hammerfest_client,
      hammerfest_store,
      Arc::clone(&link_store),
      Arc::clone(&user_store),
    ));

    RouterApi { dinoparc, hammerfest }
  }

  #[tokio::test]
  async fn test_empty_hammerfest_user() {
    let api = create_api();
    let router = create_rest_filter(api);

    let res: warp::http::Response<warp::hyper::body::Bytes> = warp::test::request()
      .path("/archive/hammerfest/hammerfest.fr/users/123")
      .reply(&router)
      .await;
    assert_eq!(res.status(), 404);
    let body: &str = std::str::from_utf8(res.body()).unwrap();
    assert_eq!(body, "{\"error\":\"HammerfestUserNotFound\"}");
  }

  #[tokio::test]
  async fn test_empty_dinoparc_user() {
    let api = create_api();
    let router = create_archive_dinoparc_filter(api);

    let res: warp::http::Response<warp::hyper::body::Bytes> = warp::test::request()
      .path("/dinoparc.com/users/123")
      .reply(&router)
      .await;

    assert_eq!(res.status(), 404);
    let body: &str = std::str::from_utf8(res.body()).unwrap();
    assert_eq!(body, "{\"error\":\"DinoparcUserNotFound\"}");
  }

  #[tokio::test]
  async fn test_empty_dinoparc_dinoz() {
    let api = create_api();
    let router = create_archive_dinoparc_filter(api);

    let res: warp::http::Response<warp::hyper::body::Bytes> = warp::test::request()
      .path("/dinoparc.com/dinoz/123")
      .reply(&router)
      .await;
    assert_eq!(res.status(), 404);
    let body: &str = std::str::from_utf8(res.body()).unwrap();
    assert_eq!(body, "{\"error\":\"DinoparcDinozNotFound\"}");
  }
}
