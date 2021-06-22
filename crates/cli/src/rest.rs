use chrono::{TimeZone, Utc};
use clap::Clap;
use etwin_core::clock::VirtualClock;
use etwin_core::dinoparc::DinoparcStore;
use etwin_core::hammerfest::{HammerfestClient, HammerfestStore};
use etwin_core::link::LinkStore;
use etwin_core::types::EtwinError;
use etwin_core::user::UserStore;
use etwin_core::uuid::Uuid4Generator;
use etwin_dinoparc_store::mem::MemDinoparcStore;
use etwin_hammerfest_client::HttpHammerfestClient;
use etwin_hammerfest_store::mem::MemHammerfestStore;
use etwin_link_store::mem::MemLinkStore;
use etwin_rest::{create_rest_filter, RouterApi};
use etwin_services::dinoparc::DinoparcService;
use etwin_services::hammerfest::HammerfestService;
use etwin_user_store::mem::MemUserStore;
use std::net::{SocketAddr, SocketAddrV6};
use std::sync::Arc;

/// Arguments to the `rest` task.
#[derive(Debug, Clap)]
pub struct RestArgs {}

fn create_api() -> RouterApi {
  let clock = Arc::new(VirtualClock::new(Utc.ymd(2020, 1, 1).and_hms(0, 0, 0)));
  let hammerfest_client: Arc<dyn HammerfestClient> = Arc::new(HttpHammerfestClient::new(Arc::clone(&clock)).unwrap());
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

pub async fn run(_args: &RestArgs) -> Result<(), EtwinError> {
  let api = create_api();
  let routes = create_rest_filter(api);

  eprintln!("Started at http://localhost:3030");

  warp::serve(routes)
    .run(SocketAddr::V6(SocketAddrV6::new(1.into(), 3030, 0, 0)))
    .await;

  Ok(())
}
