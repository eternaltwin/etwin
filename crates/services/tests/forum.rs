use chrono::Duration;
use etwin_core::api::ApiRef;
use etwin_core::auth::{AuthContext, AuthScope, GuestAuthContext, UserAuthContext};
use etwin_core::clock::VirtualClock;
use etwin_core::core::{Instant, Listing, ListingCount, LocaleId, Secret};
use etwin_core::forum::{
  AddModeratorOptions, CreatePostOptions, CreateThreadOptions, ForumActor, ForumPost, ForumPostListing,
  ForumPostRevision, ForumPostRevisionContent, ForumRole, ForumRoleGrant, ForumSection, ForumSectionListing,
  ForumSectionMeta, ForumSectionSelf, ForumStore, ForumThread, GetForumSectionOptions, GetThreadOptions,
  LatestForumPostRevisionListing, ShortForumPost, UpsertSystemSectionOptions, UserForumActor,
};
use etwin_core::user::{CreateUserOptions, ShortUser, UserStore};
use etwin_core::uuid::Uuid4Generator;
use etwin_db_schema::force_create_latest;
use etwin_forum_store::pg::PgForumStore;
use etwin_services::forum::ForumService;
use etwin_user_store::pg::PgUserStore;
use serial_test::serial;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;
use std::sync::Arc;

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
    user_store: Arc::clone(&user_store),
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
  pub(crate) user_store: TyUserStore,
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
async fn test_empty_get_all_sections_as_guest() {
  inner_test_empty_get_all_sections_as_guest(make_test_api().await).await;
}

async fn inner_test_empty_get_all_sections_as_guest<TyForum, TyForumStore, TyUserStore>(
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
    .get_sections(&AuthContext::Guest(GuestAuthContext {
      scope: AuthScope::Default,
    }))
    .await
    .unwrap();
  let expected = ForumSectionListing {
    offset: 0,
    limit: 20,
    count: 0,
    items: Vec::new(),
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
async fn test_upsert_section_then_get_it_as_guest() {
  inner_test_upsert_section_then_get_it_as_guest(make_test_api().await).await;
}

async fn inner_test_upsert_section_then_get_it_as_guest<TyForum, TyForumStore, TyUserStore>(
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
    .get_section(
      &AuthContext::Guest(GuestAuthContext {
        scope: AuthScope::Default,
      }),
      &GetForumSectionOptions {
        section: section.as_ref().into(),
        thread_offset: 0,
        thread_limit: 10,
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
      limit: 10,
      count: 0,
      items: Vec::new(),
    },
    role_grants: vec![],
    this: ForumSectionSelf { roles: vec![] },
  };
  assert_eq!(actual, expected);
}

#[tokio::test]
#[serial]
async fn test_create_thread_in_the_main_section() {
  inner_test_create_thread_in_the_main_section(make_test_api().await).await;
}

async fn inner_test_create_thread_in_the_main_section<TyForum, TyForumStore, TyUserStore>(
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
  let alice = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: "Alice".parse().unwrap(),
      email: None,
      username: None,
      password: None,
    })
    .await
    .unwrap();
  let alice_acx = AuthContext::User(UserAuthContext {
    scope: AuthScope::Default,
    user: alice.clone().into(),
    is_administrator: true,
  });
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api
    .forum
    .as_ref()
    .create_thread(
      &alice_acx,
      &CreateThreadOptions {
        section: section.as_ref().into(),
        title: "Hello".parse().unwrap(),
        body: "**First** discussion thread".to_string(),
      },
    )
    .await
    .unwrap();
  let expected = ForumThread {
    id: actual.id,
    key: None,
    title: "Hello".parse().unwrap(),
    ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 2),
    is_locked: false,
    is_pinned: false,
    section: ForumSectionMeta {
      id: section.id,
      key: Some("fr_main".parse().unwrap()),
      display_name: "Forum Général".parse().unwrap(),
      ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
      locale: Some(LocaleId::FrFr),
      threads: ListingCount { count: 1 },
      this: ForumSectionSelf {
        roles: vec![ForumRole::Administrator],
      },
    },
    posts: Listing {
      offset: 0,
      limit: 10,
      count: 1,
      items: vec![ShortForumPost {
        id: actual.posts.items[0].id,
        ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 2),
        author: ForumActor::UserForumActor(UserForumActor {
          role: None,
          user: alice.clone().into(),
        }),
        revisions: LatestForumPostRevisionListing {
          count: 1,
          last: ForumPostRevision {
            id: actual.posts.items[0].revisions.last.id,
            time: Instant::ymd_hms(2021, 1, 1, 0, 0, 2),
            author: ForumActor::UserForumActor(UserForumActor {
              role: None,
              user: alice.clone().into(),
            }),
            content: Some(ForumPostRevisionContent {
              marktwin: "**First** discussion thread".to_string(),
              html: "<strong>First</strong> discussion thread".to_string(),
            }),
            moderation: None,
            comment: None,
          },
        },
      }],
    },
  };
  assert_eq!(actual, expected);
}

#[tokio::test]
#[serial]
async fn test_create_two_sections_but_create_a_thread_in_only_one_of_them() {
  inner_test_create_two_sections_but_create_a_thread_in_only_one_of_them(make_test_api().await).await;
}

async fn inner_test_create_two_sections_but_create_a_thread_in_only_one_of_them<TyForum, TyForumStore, TyUserStore>(
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
  let en_section = api
    .forum
    .as_ref()
    .upsert_system_section(&UpsertSystemSectionOptions {
      key: "en_main".parse().unwrap(),
      display_name: "Main Forum".parse().unwrap(),
      locale: Some(LocaleId::EnUs),
    })
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let alice = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: "Alice".parse().unwrap(),
      email: None,
      username: None,
      password: None,
    })
    .await
    .unwrap();
  let alice_acx = AuthContext::User(UserAuthContext {
    scope: AuthScope::Default,
    user: alice.clone().into(),
    is_administrator: true,
  });
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .forum
    .as_ref()
    .create_thread(
      &alice_acx,
      &CreateThreadOptions {
        section: section.as_ref().into(),
        title: "Hello".parse().unwrap(),
        body: "**First** discussion thread".to_string(),
      },
    )
    .await
    .unwrap();
  let actual = api.forum.as_ref().get_sections(&alice_acx).await.unwrap();
  let expected = ForumSectionListing {
    count: 2,
    offset: 0,
    limit: 20,
    items: vec![
      ForumSectionMeta {
        id: section.id,
        key: Some("fr_main".parse().unwrap()),
        display_name: "Forum Général".parse().unwrap(),
        ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
        locale: Some(LocaleId::FrFr),
        threads: ListingCount { count: 1 },
        this: ForumSectionSelf {
          roles: vec![ForumRole::Administrator],
        },
      },
      ForumSectionMeta {
        id: en_section.id,
        key: Some("en_main".parse().unwrap()),
        display_name: "Main Forum".parse().unwrap(),
        ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 1),
        locale: Some(LocaleId::EnUs),
        threads: ListingCount { count: 0 },
        this: ForumSectionSelf {
          roles: vec![ForumRole::Administrator],
        },
      },
    ],
  };
  assert_eq!(actual, expected);
}

#[tokio::test]
#[serial]
async fn test_create_thread_in_the_main_section_and_post_10_messages() {
  inner_test_create_thread_in_the_main_section_and_post_10_messages(make_test_api().await).await;
}

async fn inner_test_create_thread_in_the_main_section_and_post_10_messages<TyForum, TyForumStore, TyUserStore>(
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
  let alice = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: "Alice".parse().unwrap(),
      email: None,
      username: None,
      password: None,
    })
    .await
    .unwrap();
  let alice_acx = AuthContext::User(UserAuthContext {
    scope: AuthScope::Default,
    user: alice.clone().into(),
    is_administrator: true,
  });
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let thread: ForumThread = api
    .forum
    .as_ref()
    .create_thread(
      &alice_acx,
      &CreateThreadOptions {
        section: section.as_ref().into(),
        title: "Hello".parse().unwrap(),
        body: "Original post".to_string(),
      },
    )
    .await
    .unwrap();
  let mut posts: Vec<ForumPost> = Vec::new();
  for post_idx in 0..10 {
    api.clock.as_ref().advance_by(Duration::seconds(1));
    let post = api
      .forum
      .as_ref()
      .create_post(
        &alice_acx,
        &CreatePostOptions {
          thread: thread.as_ref().into(),
          body: format!("Reply {}", post_idx).parse().unwrap(),
        },
      )
      .await
      .unwrap();
    posts.push(post);
  }
  assert_eq!(posts.len(), 10);
  let actual = api
    .forum
    .as_ref()
    .get_thread(
      &alice_acx,
      &GetThreadOptions {
        thread: thread.id.into(),
        post_offset: 7,
        post_limit: 5,
      },
    )
    .await
    .unwrap();
  let expected = ForumThread {
    id: thread.id,
    key: None,
    title: "Hello".parse().unwrap(),
    ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 2),
    is_locked: false,
    is_pinned: false,
    section: ForumSectionMeta {
      id: section.id,
      key: Some("fr_main".parse().unwrap()),
      display_name: "Forum Général".parse().unwrap(),
      locale: Some(LocaleId::FrFr),
      ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
      threads: ListingCount { count: 1 },
      this: ForumSectionSelf {
        roles: vec![ForumRole::Administrator],
      },
    },
    posts: ForumPostListing {
      count: 11,
      offset: 7,
      limit: 5,
      items: vec![
        ShortForumPost {
          id: posts[6].id,
          ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 9),
          author: ForumActor::UserForumActor(UserForumActor {
            role: None,
            user: ShortUser {
              id: alice.id,
              display_name: alice.display_name.clone(),
            },
          }),
          revisions: LatestForumPostRevisionListing {
            count: 1,
            last: ForumPostRevision {
              id: posts[6].revisions.last.id,
              time: Instant::ymd_hms(2021, 1, 1, 0, 0, 9),
              author: ForumActor::UserForumActor(UserForumActor {
                role: None,
                user: ShortUser {
                  id: alice.id,
                  display_name: alice.display_name.clone(),
                },
              }),
              content: Some(ForumPostRevisionContent {
                marktwin: "Reply 6".parse().unwrap(),
                html: "Reply 6".parse().unwrap(),
              }),
              moderation: None,
              comment: None,
            },
          },
        },
        ShortForumPost {
          id: posts[7].id,
          ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 10),
          author: ForumActor::UserForumActor(UserForumActor {
            role: None,
            user: ShortUser {
              id: alice.id,
              display_name: alice.display_name.clone(),
            },
          }),
          revisions: LatestForumPostRevisionListing {
            count: 1,
            last: ForumPostRevision {
              id: posts[7].revisions.last.id,
              time: Instant::ymd_hms(2021, 1, 1, 0, 0, 10),
              author: ForumActor::UserForumActor(UserForumActor {
                role: None,
                user: ShortUser {
                  id: alice.id,
                  display_name: alice.display_name.clone(),
                },
              }),
              content: Some(ForumPostRevisionContent {
                marktwin: "Reply 7".parse().unwrap(),
                html: "Reply 7".parse().unwrap(),
              }),
              moderation: None,
              comment: None,
            },
          },
        },
        ShortForumPost {
          id: posts[8].id,
          ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 11),
          author: ForumActor::UserForumActor(UserForumActor {
            role: None,
            user: ShortUser {
              id: alice.id,
              display_name: alice.display_name.clone(),
            },
          }),
          revisions: LatestForumPostRevisionListing {
            count: 1,
            last: ForumPostRevision {
              id: posts[8].revisions.last.id,
              time: Instant::ymd_hms(2021, 1, 1, 0, 0, 11),
              author: ForumActor::UserForumActor(UserForumActor {
                role: None,
                user: ShortUser {
                  id: alice.id,
                  display_name: alice.display_name.clone(),
                },
              }),
              content: Some(ForumPostRevisionContent {
                marktwin: "Reply 8".parse().unwrap(),
                html: "Reply 8".parse().unwrap(),
              }),
              moderation: None,
              comment: None,
            },
          },
        },
        ShortForumPost {
          id: posts[9].id,
          ctime: Instant::ymd_hms(2021, 1, 1, 0, 0, 12),
          author: ForumActor::UserForumActor(UserForumActor {
            role: None,
            user: ShortUser {
              id: alice.id,
              display_name: alice.display_name.clone(),
            },
          }),
          revisions: LatestForumPostRevisionListing {
            count: 1,
            last: ForumPostRevision {
              id: posts[9].revisions.last.id,
              time: Instant::ymd_hms(2021, 1, 1, 0, 0, 12),
              author: ForumActor::UserForumActor(UserForumActor {
                role: None,
                user: ShortUser {
                  id: alice.id,
                  display_name: alice.display_name.clone(),
                },
              }),
              content: Some(ForumPostRevisionContent {
                marktwin: "Reply 9".parse().unwrap(),
                html: "Reply 9".parse().unwrap(),
              }),
              moderation: None,
              comment: None,
            },
          },
        },
      ],
    },
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
    .user_store
    .create_user(&CreateUserOptions {
      display_name: "Alice".parse().unwrap(),
      email: None,
      username: None,
      password: None,
    })
    .await
    .unwrap();
  let bob = api
    .user_store
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
      limit: 10,
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
