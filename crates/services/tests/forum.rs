use chrono::{TimeZone, Utc};
use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::core::{Listing, LocaleId, Secret};
use etwin_core::user::UserStore;
use etwin_core::uuid::Uuid4Generator;
use etwin_db_schema::force_create_latest;
use etwin_user_store::pg::PgUserStore;
use serial_test::serial;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;
use std::sync::Arc;

use etwin_core::forum::{ForumSection, ForumSectionSelf, ForumStore, UpsertSystemSectionOptions};
use etwin_forum_store::pg::PgForumStore;
use etwin_services::forum::ForumService;

async fn make_test_api() -> TestApi<
  Arc<ForumService<Arc<VirtualClock>, Arc<dyn ForumStore>, Arc<dyn UserStore>>>,
  Arc<dyn ForumStore>,
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
  let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
  let uuid_generator = Arc::new(Uuid4Generator);
  let forum_store: Arc<dyn ForumStore> = Arc::new(PgForumStore::new(
    Arc::clone(&clock),
    Arc::clone(&database),
    Arc::clone(&uuid_generator),
  ));
  let user_store: Arc<dyn UserStore> = Arc::new(PgUserStore::new(
    Arc::clone(&clock),
    Arc::clone(&database),
    Secret::new("dev_secret".to_string()),
    Arc::clone(&uuid),
  ));
  let forum = Arc::new(ForumService::new(
    Arc::clone(&clock),
    Arc::clone(&forum_store),
    Arc::clone(&user_store),
  ));

  TestApi {
    clock,
    forum,
    _forum_store: Arc::clone(&forum_store),
    _user_store: Arc::clone(&user_store),
  }
}

struct TestApi<TyForum, TyForumStore, TyUserStore>
where
  TyForum: ApiRef<ForumService<Arc<VirtualClock>, TyForumStore, TyUserStore>>,
  TyForumStore: ForumStore,
  TyUserStore: UserStore,
{
  pub(crate) clock: Arc<VirtualClock>,
  pub(crate) forum: TyForum,
  pub(crate) _forum_store: TyForumStore,
  pub(crate) _user_store: TyUserStore,
}

#[tokio::test]
#[serial]
async fn test_create_main_forum_section() {
  inner_test_create_main_forum_section(make_test_api().await).await;
}

async fn inner_test_create_main_forum_section<TyForum, TyForumStore, TyUserStore>(
  api: TestApi<TyForum, TyForumStore, TyUserStore>,
) where
  TyForum: ApiRef<ForumService<Arc<VirtualClock>, TyForumStore, TyUserStore>>,
  TyForumStore: ForumStore,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let actual = api
    .forum
    .as_ref()
    .upsert_system_section(&UpsertSystemSectionOptions {
      key: "fr_main".parse().unwrap(),
      display_name: "Forum Général".parse().unwrap(),
      locale: Some(LocaleId::FrFr),
    })
    .await
    .unwrap();
  let expected = ForumSection {
    id: actual.id,
    key: Some("fr_main".parse().unwrap()),
    display_name: "Forum Général".parse().unwrap(),
    ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
    locale: Some(LocaleId::FrFr),
    threads: Listing {
      offset: 0,
      limit: 20,
      count: 0,
      items: vec![],
    },
    role_grants: vec![],
    this: ForumSectionSelf { roles: vec![] },
  };
  assert_eq!(actual, expected);
}
