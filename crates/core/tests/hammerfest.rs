use chrono::{TimeZone, Utc};
use etwin_core::api::ApiRef;
use etwin_core::hammerfest::{HammerfestClient, HammerfestStore};
use etwin_core::link::LinkStore;
use etwin_core::services::hammerfest::HammerfestService;
use etwin_core::user::UserStore;
use etwin_core::uuid::Uuid4Generator;
use etwin_core::{
  auth::AuthContext,
  clock::VirtualClock,
  hammerfest::{GetHammerfestUserOptions, HammerfestServer, HammerfestUserId},
};
use etwin_db_schema::force_create_latest;
use etwin_hammerfest_client::MemHammerfestClient;
use etwin_hammerfest_store::{mem::MemHammerfestStore, pg::PgHammerfestStore};
use etwin_link_store::{mem::MemLinkStore, pg::PgLinkStore};
use etwin_user_store::{mem::InMemorySimpleUserService, pg::PgUserStore};
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;
use std::marker::PhantomData;
use std::sync::Arc;

async fn make_test_api() -> TestApi<
  Arc<VirtualClock>,
  Arc<dyn HammerfestClient>,
  Arc<dyn HammerfestStore>,
  Arc<HammerfestService<Arc<dyn HammerfestClient>, Arc<dyn HammerfestStore>, Arc<dyn LinkStore>, Arc<dyn UserStore>>>,
  Arc<dyn LinkStore>,
  Arc<dyn UserStore>,
> {
  let config = etwin_config::find_config(std::env::current_dir().unwrap()).unwrap();
  let database: PgPool = PgPoolOptions::new()
    .max_connections(5)
    .connect_with(
      PgConnectOptions::new()
        .host(&config.db.host)
        .port(config.db.port)
        .database(&config.db.name)
        .username(&config.db.user)
        .password(&config.db.password),
    )
    .await
    .unwrap();
  force_create_latest(&database).await.unwrap();

  let database = Arc::new(database);

  let uuid = Arc::new(Uuid4Generator);
  let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
  let hammerfest_client: Arc<dyn HammerfestClient> = Arc::new(MemHammerfestClient::new(Arc::clone(&clock)));
  let hammerfest_store: Arc<dyn HammerfestStore> =
    Arc::new(PgHammerfestStore::new(Arc::clone(&clock), Arc::clone(&database)));
  let link_store: Arc<dyn LinkStore> = Arc::new(PgLinkStore::new(Arc::clone(&clock), Arc::clone(&database)));
  let user_store: Arc<dyn UserStore> = Arc::new(PgUserStore::new(
    Arc::clone(&clock),
    Arc::clone(&database),
    Arc::clone(&uuid),
  ));
  let hammerfest = Arc::new(HammerfestService::new(
    Arc::clone(&hammerfest_client),
    Arc::clone(&hammerfest_store),
    Arc::clone(&link_store),
    Arc::clone(&user_store),
  ));

  TestApi {
    clock,
    hammerfest_client,
    hammerfest_store,
    hammerfest,
    _link_store: PhantomData,
    _user_store: PhantomData,
  }
}

struct TestApi<TyClock, TyHammerfestClient, TyHammerfestStore, TyHammerfest, TyLinkStore, TyUserStore>
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestClient: HammerfestClient,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
  TyHammerfest: ApiRef<HammerfestService<TyHammerfestClient, TyHammerfestStore, TyLinkStore, TyUserStore>>,
{
  pub(crate) clock: TyClock,
  pub(crate) hammerfest_client: TyHammerfestClient,
  pub(crate) hammerfest_store: TyHammerfestStore,
  pub(crate) hammerfest: TyHammerfest,
  pub(crate) _link_store: PhantomData<TyLinkStore>,
  pub(crate) _user_store: PhantomData<TyUserStore>,
}

#[tokio::test]
async fn test_empty() {
  inner_test_empty(make_test_api().await).await;
}

async fn inner_test_empty<TyClock, TyHammerfestClient, TyHammerfestStore, TyHammerfest, TyLinkStore, TyUserStore>(
  api: TestApi<TyClock, TyHammerfestClient, TyHammerfestStore, TyHammerfest, TyLinkStore, TyUserStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestClient: HammerfestClient,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
  TyHammerfest: ApiRef<HammerfestService<TyHammerfestClient, TyHammerfestStore, TyLinkStore, TyUserStore>>,
{
  let actual: Option<()> = None;
  let expected: Option<()> = None;
  assert_eq!(actual, expected);
}

#[tokio::test]
async fn test_reference_types() {
  let uuid = Uuid4Generator;
  let clock = VirtualClock::new(Utc.timestamp(1607531946, 0));
  let hammerfest_client = MemHammerfestClient::new(&clock);
  let hammerfest_store = MemHammerfestStore::new(&clock);
  let link_store = MemLinkStore::new(&clock);
  let user_store = InMemorySimpleUserService::new(&clock, &uuid);
  let hammerfest = HammerfestService::new(&hammerfest_client, &hammerfest_store, &link_store, &user_store);

  let options = &GetHammerfestUserOptions {
    server: HammerfestServer::HammerfestFr,
    id: "999999".parse().unwrap(),
    time: None,
  };
  assert_eq!(hammerfest.get_user(AuthContext::Guest, &options).await.unwrap(), None);
}
