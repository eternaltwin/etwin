use etwin_core::api::ApiRef;
use etwin_core::core::Secret;
use etwin_core::hammerfest::{HammerfestClient, HammerfestStore, HammerfestUser};
use etwin_core::link::LinkStore;
use etwin_core::user::UserStore;
use etwin_core::uuid::Uuid4Generator;
use etwin_core::{
  auth::AuthContext,
  clock::VirtualClock,
  hammerfest::{GetHammerfestUserOptions, HammerfestServer},
};
use etwin_db_schema::force_create_latest;
use etwin_hammerfest_client::MemHammerfestClient;
use etwin_hammerfest_store::{mem::MemHammerfestStore, pg::PgHammerfestStore};
use etwin_link_store::{mem::MemLinkStore, pg::PgLinkStore};
use etwin_user_store::{mem::MemUserStore, pg::PgUserStore};
use serial_test::serial;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;
use std::marker::PhantomData;
use std::sync::Arc;

use etwin_core::auth::{AuthScope, GuestAuthContext};
use etwin_core::core::Instant;
use etwin_services::hammerfest::HammerfestService;

async fn make_test_api() -> TestApi<
  Arc<VirtualClock>,
  Arc<dyn HammerfestClient>,
  Arc<dyn HammerfestStore>,
  Arc<HammerfestService<Arc<dyn HammerfestClient>, Arc<dyn HammerfestStore>, Arc<dyn LinkStore>, Arc<dyn UserStore>>>,
  Arc<dyn LinkStore>,
  Arc<dyn UserStore>,
> {
  let config = etwin_config::find_config(std::env::current_dir().unwrap()).unwrap();
  let admin_database: PgPool = PgPoolOptions::new()
    .max_connections(5)
    .connect_with(
      PgConnectOptions::new()
        .host(&config.db.host)
        .port(config.db.port)
        .database(&config.db.name)
        .username(&config.db.admin_user)
        .password(&config.db.admin_password),
    )
    .await
    .unwrap();
  force_create_latest(&admin_database, true).await.unwrap();
  admin_database.close().await;

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
  let database = Arc::new(database);

  let uuid = Arc::new(Uuid4Generator);
  let clock = Arc::new(VirtualClock::new(Instant::ymd_hms(2020, 1, 1, 0, 0, 0)));
  let hammerfest_client: Arc<dyn HammerfestClient> = Arc::new(MemHammerfestClient::new(Arc::clone(&clock)));
  let uuid_generator = Arc::new(Uuid4Generator);
  let database_secret = Secret::new("dev_secret".to_string());
  let hammerfest_store: Arc<dyn HammerfestStore> = Arc::new(
    PgHammerfestStore::new(
      Arc::clone(&clock),
      Arc::clone(&database),
      database_secret,
      uuid_generator,
    )
    .await
    .unwrap(),
  );
  let link_store: Arc<dyn LinkStore> = Arc::new(PgLinkStore::new(Arc::clone(&clock), Arc::clone(&database)));
  let user_store: Arc<dyn UserStore> = Arc::new(PgUserStore::new(
    Arc::clone(&clock),
    Arc::clone(&database),
    Secret::new("dev_secret".to_string()),
    Arc::clone(&uuid),
  ));
  let hammerfest = Arc::new(HammerfestService::new(
    Arc::clone(&hammerfest_client),
    Arc::clone(&hammerfest_store),
    Arc::clone(&link_store),
    Arc::clone(&user_store),
  ));

  TestApi {
    _clock: clock,
    _hammerfest_client: hammerfest_client,
    _hammerfest_store: hammerfest_store,
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
  pub(crate) _clock: TyClock,
  pub(crate) _hammerfest_client: TyHammerfestClient,
  pub(crate) _hammerfest_store: TyHammerfestStore,
  pub(crate) hammerfest: TyHammerfest,
  pub(crate) _link_store: PhantomData<TyLinkStore>,
  pub(crate) _user_store: PhantomData<TyUserStore>,
}

#[tokio::test]
#[serial]
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
  let options = &GetHammerfestUserOptions {
    server: HammerfestServer::HammerfestFr,
    id: "999999".parse().unwrap(),
    time: None,
  };
  let actual = api
    .hammerfest
    .as_ref()
    .get_user(
      &AuthContext::Guest(GuestAuthContext {
        scope: AuthScope::Default,
      }),
      options,
    )
    .await
    .unwrap();
  let expected: Option<HammerfestUser> = None;
  assert_eq!(actual, expected);
}

#[tokio::test]
#[serial]
async fn test_reference_types() {
  let uuid = Uuid4Generator;
  let clock = VirtualClock::new(Instant::ymd_hms(2020, 1, 1, 0, 0, 0));
  let hammerfest_client = MemHammerfestClient::new(&clock);
  let hammerfest_store = MemHammerfestStore::new(&clock);
  let link_store = MemLinkStore::new(&clock);
  let user_store = MemUserStore::new(&clock, &uuid);
  let hammerfest = HammerfestService::new(&hammerfest_client, &hammerfest_store, &link_store, &user_store);

  let options = &GetHammerfestUserOptions {
    server: HammerfestServer::HammerfestFr,
    id: "999999".parse().unwrap(),
    time: None,
  };
  assert_eq!(
    hammerfest
      .get_user(
        &AuthContext::Guest(GuestAuthContext {
          scope: AuthScope::Default,
        }),
        options
      )
      .await
      .unwrap(),
    None
  );
}
