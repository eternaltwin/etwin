use chrono::Duration;
use etwin_core::api::ApiRef;
use etwin_core::auth::{AuthContext, AuthScope, GuestAuthContext, UserAuthContext};
use etwin_core::clock::VirtualClock;
use etwin_core::core::{Instant, Listing, ListingCount, LocaleId, Secret};
use etwin_core::user::{CreateUserOptions, ShortUser, UserStore};
use etwin_core::uuid::Uuid4Generator;
use etwin_db_schema::force_create_latest;
use etwin_user_store::pg::PgUserStore;
use serial_test::serial;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;
use std::sync::Arc;

use etwin_core::forum::{
  AddModeratorOptions, ForumRole, ForumRoleGrant, ForumSection, ForumSectionListing, ForumSectionMeta,
  ForumSectionSelf, ForumStore, UpsertSystemSectionOptions,
};
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
  let clock = Arc::new(VirtualClock::new(Instant::ymd_hms(2020, 1, 1, 0, 0, 0)));
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
  api.clock.as_ref().advance_to(Instant::ymd_hms(2021, 1, 1, 0, 0, 0));
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
    ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
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

#[tokio::test]
#[serial]
async fn test_upsert_forum_section_idempotent() {
  inner_test_upsert_forum_section_idempotent(make_test_api().await).await;
}

async fn inner_test_upsert_forum_section_idempotent<TyForum, TyForumStore, TyUserStore>(
  api: TestApi<TyForum, TyForumStore, TyUserStore>,
) where
  TyForum: ApiRef<ForumService<Arc<VirtualClock>, TyForumStore, TyUserStore>>,
  TyForumStore: ForumStore,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Instant::ymd_hms(2021, 1, 1, 0, 0, 0));
  api
    .forum
    .as_ref()
    .upsert_system_section(&UpsertSystemSectionOptions {
      key: "fr_main".parse().unwrap(),
      display_name: "Forum Général".parse().unwrap(),
      locale: Some(LocaleId::FrFr),
    })
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
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
    ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
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

#[tokio::test]
#[serial]
async fn test_upsert_section_then_get_all_sections_as_guest() {
  inner_test_upsert_section_then_get_all_sections_as_guest(make_test_api().await).await;
}

async fn inner_test_upsert_section_then_get_all_sections_as_guest<TyForum, TyForumStore, TyUserStore>(
  api: TestApi<TyForum, TyForumStore, TyUserStore>,
) where
  TyForum: ApiRef<ForumService<Arc<VirtualClock>, TyForumStore, TyUserStore>>,
  TyForumStore: ForumStore,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Instant::ymd_hms(2021, 1, 1, 0, 0, 0));
  let section = api
    .forum
    .as_ref()
    .upsert_system_section(&UpsertSystemSectionOptions {
      key: "fr_main".parse().unwrap(),
      display_name: "Forum Général".parse().unwrap(),
      locale: Some(LocaleId::FrFr),
    })
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api
    .forum
    .as_ref()
    .get_sections(&AuthContext::Guest(GuestAuthContext {
      scope: AuthScope::Default,
    }))
    .await
    .unwrap();
  let expected = ForumSectionListing {
    offset: 0,
    limit: 20,
    count: 1,
    items: vec![ForumSectionMeta {
      id: section.id,
      key: Some("fr_main".parse().unwrap()),
      display_name: "Forum Général".parse().unwrap(),
      ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
      locale: Some(LocaleId::FrFr),
      threads: ListingCount { count: 0 },
      this: ForumSectionSelf { roles: vec![] },
    }],
  };
  assert_eq!(actual, expected);
}

#[tokio::test]
#[serial]
async fn administrators_can_add_moderators() {
  inner_administrators_can_add_moderators(make_test_api().await).await;
}

async fn inner_administrators_can_add_moderators<TyForum, TyForumStore, TyUserStore>(
  api: TestApi<TyForum, TyForumStore, TyUserStore>,
) where
  TyForum: ApiRef<ForumService<Arc<VirtualClock>, TyForumStore, TyUserStore>>,
  TyForumStore: ForumStore,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Instant::ymd_hms(2021, 1, 1, 0, 0, 0));
  let section = api
    .forum
    .as_ref()
    .upsert_system_section(&UpsertSystemSectionOptions {
      key: "fr_main".parse().unwrap(),
      display_name: "Forum Général".parse().unwrap(),
      locale: Some(LocaleId::FrFr),
    })
    .await
    .unwrap();
  let section = &section;
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let alice = api
    ._user_store
    .create_user(&CreateUserOptions {
      display_name: "Alice".parse().unwrap(),
      email: None,
      username: None,
      password: None,
    })
    .await
    .unwrap();
  let bob = api
    ._user_store
    .create_user(&CreateUserOptions {
      display_name: "Bob".parse().unwrap(),
      email: None,
      username: None,
      password: None,
    })
    .await
    .unwrap();
  let actual: ForumSection = api
    .forum
    .as_ref()
    .add_moderator(
      &AuthContext::User(UserAuthContext {
        scope: AuthScope::Default,
        user: alice.clone().into(),
        is_administrator: true,
      }),
      &AddModeratorOptions {
        section: section.into(),
        user: bob.id.into(),
      },
    )
    .await
    .unwrap();
  let expected = ForumSection {
    id: section.id,
    key: Some("fr_main".parse().unwrap()),
    display_name: "Forum Général".parse().unwrap(),
    ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
    locale: Some(LocaleId::FrFr),
    threads: Listing {
      offset: 0,
      limit: 0,
      count: 0,
      items: vec![],
    },
    role_grants: vec![ForumRoleGrant {
      role: ForumRole::Moderator,
      user: ShortUser {
        id: bob.id,
        display_name: bob.display_name.clone(),
      },
      start_time: Instant::ymd_hms(2021, 1, 1, 0, 0, 1),
      granted_by: ShortUser {
        id: alice.id,
        display_name: alice.display_name.clone(),
      },
    }],
    this: ForumSectionSelf {
      roles: vec![ForumRole::Administrator],
    },
  };
  assert_eq!(actual, expected);
}
