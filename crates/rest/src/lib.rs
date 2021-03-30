use etwin_core::auth::{AuthContext, AuthScope, GuestAuthContext};
use etwin_core::hammerfest::{GetHammerfestUserOptions, HammerfestServer, HammerfestUserId};
use etwin_core::types::EtwinError;
use etwin_services::hammerfest::DynHammerfestService;
pub use serde::Serialize;
use std::convert::Infallible;
use std::sync::Arc;
use warp::filters::BoxedFilter;
use warp::http::StatusCode;
use warp::reject::Reject;
use warp::reply::{Json, WithStatus};
use warp::{Filter, Rejection};

#[derive(Debug)]
struct ServerError(EtwinError);

impl Reject for ServerError {}

#[derive(Clone)]
pub struct RouterApi {
  pub hammerfest: Arc<DynHammerfestService>,
}

pub type RestFilter = BoxedFilter<(WithStatus<Json>,)>;

#[derive(Copy, Clone, Debug, Serialize)]
#[serde(tag = "error")]
enum GetHammerfestUserError {
  HammerfestUserNotFound(HammerfestUserNotFound),
  InternalServerError,
}

impl Reject for GetHammerfestUserError {}

#[derive(Copy, Clone, Debug, Serialize)]
struct HammerfestUserNotFound {}

pub fn create_rest_filter(api: RouterApi) -> RestFilter {
  async fn recover(err: Rejection) -> Result<WithStatus<Json>, Infallible> {
    let status: StatusCode;
    let err = if err.is_not_found() {
      status = StatusCode::NOT_FOUND;
      GetHammerfestUserError::HammerfestUserNotFound(HammerfestUserNotFound {})
    } else {
      eprintln!("{:?}", err);
      status = StatusCode::INTERNAL_SERVER_ERROR;
      GetHammerfestUserError::InternalServerError
    };
    let body = warp::reply::json(&err);
    Ok(warp::reply::with_status(body, status))
  }

  warp::path!("archive" / "hammerfest" / HammerfestServer / "users" / HammerfestUserId)
    .and_then(move |server: HammerfestServer, id: HammerfestUserId| {
      let hammerfest = api.hammerfest.clone();
      async move {
        let acx = AuthContext::Guest(GuestAuthContext {
          scope: AuthScope::Default,
        });
        let res = match hammerfest
          .get_user(&acx, &GetHammerfestUserOptions { server, id, time: None })
          .await
        {
          Ok(Some(user)) => Ok(warp::reply::with_status(warp::reply::json(&user), StatusCode::OK)),
          Ok(None) => Err(warp::reject::not_found()),
          Err(e) => Err(warp::reject::custom(ServerError(e))),
        };
        // let res: Result<WithStatus<Json>, Infallible> = match res {
        //   Ok(r) => Ok(r),
        //   Err(e) => recover(e).await,
        // };
        res
      }
    })
    .recover(recover)
    .unify()
    .boxed()
}

#[cfg(test)]
mod test {
  use crate::{create_rest_filter, RouterApi};
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::hammerfest::{HammerfestClient, HammerfestStore};
  use etwin_core::link::LinkStore;
  use etwin_core::user::UserStore;
  use etwin_core::uuid::Uuid4Generator;
  use etwin_hammerfest_client::MemHammerfestClient;
  use etwin_hammerfest_store::mem::MemHammerfestStore;
  use etwin_link_store::mem::MemLinkStore;
  use etwin_services::hammerfest::HammerfestService;
  use etwin_user_store::mem::MemUserStore;
  use std::sync::Arc;

  fn create_api() -> RouterApi {
    let clock = Arc::new(VirtualClock::new(Utc.ymd(2020, 1, 1).and_hms(0, 0, 0)));
    let hammerfest_client: Arc<dyn HammerfestClient> = Arc::new(MemHammerfestClient::new(Arc::clone(&clock)));
    let hammerfest_store: Arc<dyn HammerfestStore> = Arc::new(MemHammerfestStore::new(Arc::clone(&clock)));
    let link_store: Arc<dyn LinkStore> = Arc::new(MemLinkStore::new(Arc::clone(&clock)));
    let user_store: Arc<dyn UserStore> = Arc::new(MemUserStore::new(Arc::clone(&clock), Uuid4Generator));

    let hammerfest = Arc::new(HammerfestService::new(
      hammerfest_client,
      hammerfest_store,
      link_store,
      user_store,
    ));

    RouterApi { hammerfest }
  }

  #[tokio::test]
  async fn test_router() {
    let api = create_api();
    let router = create_rest_filter(api);

    // Execute `sum` and get the `Extract` back.
    let res: warp::http::Response<warp::hyper::body::Bytes> = warp::test::request()
      .path("/archive/hammerfest/hammerfest.fr/users/123")
      .reply(&router)
      .await;
    // value.
    assert_eq!(res.status(), 404);
  }
}
