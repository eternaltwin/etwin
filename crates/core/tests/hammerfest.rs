use etwin_hammerfest_store::pg::PgHammerfestStore;
use std::ops::Deref;
use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use chrono::{Utc, TimeZone};
use etwin_db_schema::force_create_latest;
use etwin_core::clock::{VirtualClock, Clock};
use etwin_core::hammerfest::{HammerfestStore, HammerfestClient};
use etwin_core::services::hammerfest::HammerfestService;
use etwin_hammerfest_client::HammerfestClientMem;
use etwin_core::link::LinkStore;
use etwin_core::user::UserStore;
use etwin_link_store::pg::PgLinkStore;
use etwin_user_store::pg::PgUserStore;
use etwin_core::uuid::Uuid4Generator;
use std::any::Any;

async fn make_test_api() -> TestApi<
  Arc<VirtualClock>,
  Arc<dyn HammerfestClient>,
  Arc<dyn HammerfestStore>,
  Arc<HammerfestService<Arc<dyn HammerfestClient>, Arc<dyn HammerfestStore>, Arc<dyn LinkStore>, Arc<dyn UserStore>>>,
  Arc<dyn LinkStore>,
  Arc<dyn UserStore>,
> {
  let database: PgPool = PgPoolOptions::new()
    .max_connections(5)
    .connect("postgresql://etwin:dev@localhost:5432/etwindb")
    .await
    .unwrap();
  force_create_latest(&database).await.unwrap();

  let database = Arc::new(database);

  let uuid = Arc::new(Uuid4Generator);
  let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
  let hammerfest_client: Arc<dyn HammerfestClient> = Arc::new(HammerfestClientMem::new(Arc::clone(&clock)));
  let hammerfest_store: Arc<dyn HammerfestStore> = Arc::new(PgHammerfestStore::new(Arc::clone(&clock), Arc::clone(&database)));
  let link_store: Arc<dyn LinkStore> = Arc::new(PgLinkStore::new(Arc::clone(&clock), Arc::clone(&database)));
  let user_store: Arc<dyn UserStore> = Arc::new(PgUserStore::new(Arc::clone(&clock), Arc::clone(&database), Arc::clone(&uuid)));
  let hammerfest = Arc::new(HammerfestService::new(
    Arc::clone(&hammerfest_client),
    Arc::clone(&hammerfest_store),
    Arc::clone(&link_store),
    Arc::clone(&user_store),
  ));

  TestApi { clock, hammerfest_client, hammerfest_store, hammerfest }
}

struct TestApi<TyClock, TyHammerfestClient, TyHammerfestStore, TyHammerfest, TyLinkStore, TyUserStore>
  where
    TyClock: Deref<Target=VirtualClock> + Send + Sync,
    TyHammerfestClient: Deref + Send + Sync,
    <TyHammerfestClient as Deref>::Target: HammerfestClient,
    TyHammerfestStore: Deref + Send + Sync,
    <TyHammerfestStore as Deref>::Target: HammerfestStore,
    TyLinkStore: Deref + Send + Sync,
    <TyLinkStore as Deref>::Target: LinkStore,
    TyUserStore: Deref + Send + Sync,
    <TyUserStore as Deref>::Target: UserStore,
    TyHammerfest: Deref<Target=HammerfestService<TyHammerfestClient, TyHammerfestStore, TyLinkStore, TyUserStore>> + Send + Sync,
{
  pub(crate) clock: TyClock,
  pub(crate) hammerfest_client: TyHammerfestClient,
  pub(crate) hammerfest_store: TyHammerfestStore,
  pub(crate) hammerfest: TyHammerfest,
}

#[tokio::test]
async fn test_empty() {
  inner_test_empty(make_test_api().await).await;
}

async fn inner_test_empty<TyClock, TyHammerfestClient, TyHammerfestStore, TyHammerfest, TyLinkStore, TyUserStore>(api: TestApi<TyClock, TyHammerfestClient, TyHammerfestStore, TyHammerfest, TyLinkStore, TyUserStore>)
  where
    TyClock: Deref<Target=VirtualClock> + Send + Sync,
    TyHammerfestClient: Deref + Send + Sync,
    <TyHammerfestClient as Deref>::Target: HammerfestClient,
    TyHammerfestStore: Deref + Send + Sync,
    <TyHammerfestStore as Deref>::Target: HammerfestStore,
    TyLinkStore: Deref + Send + Sync,
    <TyLinkStore as Deref>::Target: LinkStore,
    TyUserStore: Deref + Send + Sync,
    <TyUserStore as Deref>::Target: UserStore,
    TyHammerfest: Deref<Target=HammerfestService<TyHammerfestClient, TyHammerfestStore, TyLinkStore, TyUserStore>> + Send + Sync,
{
  let actual: Option<()> = None;
  let expected: Option<()> = None;
  assert_eq!(actual, expected);
}
