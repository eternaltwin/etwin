use chrono::{Duration, TimeZone, Utc};
use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::hammerfest::{
  GetHammerfestUserOptions, HammerfestDate, HammerfestDateTime, HammerfestForumPost, HammerfestForumPostAuthor,
  HammerfestForumPostListing, HammerfestForumRole, HammerfestForumThemePage, HammerfestForumThemePageResponse,
  HammerfestForumThread, HammerfestForumThreadKind, HammerfestForumThreadListing, HammerfestForumThreadPage,
  HammerfestForumThreadPageResponse, HammerfestGodchild, HammerfestGodchildrenResponse, HammerfestInventoryResponse,
  HammerfestLadderLevel, HammerfestProfile, HammerfestProfileResponse, HammerfestServer, HammerfestSessionUser,
  HammerfestShop, HammerfestShopResponse, HammerfestStore, ShortHammerfestForumTheme, ShortHammerfestForumThread,
  ShortHammerfestUser, StoredHammerfestUser,
};
use std::collections::HashMap;
use std::convert::TryInto;
use std::num::NonZeroU16;

#[macro_export]
macro_rules! test_hammerfest_store {
  ($(#[$meta:meta])* || $api:expr) => {
    register_test!($(#[$meta])*, $api, test_empty);
    register_test!($(#[$meta])*, $api, test_touch_user);
    register_test!($(#[$meta])*, $api, test_get_missing_user);
  };
}

// TODO: Remove these pg-specific tests: they should be supported by the mem impl too.
#[macro_export]
macro_rules! test_hammerfest_store_pg {
  ($(#[$meta:meta])* || $api:expr) => {
    register_test!($(#[$meta])*, $api, test_touch_profile_empty);
    register_test!($(#[$meta])*, $api, test_touch_matching_profile);
    register_test!($(#[$meta])*, $api, test_touch_changed_profile);
    register_test!($(#[$meta])*, $api, test_touch_profile_with_email);
    register_test!($(#[$meta])*, $api, test_change_profile_back);
    register_test!($(#[$meta])*, $api, test_changed_email);
    register_test!($(#[$meta])*, $api, test_change_email_back);
    register_test!($(#[$meta])*, $api, test_email_uniqueness);
    register_test!($(#[$meta])*, $api, test_touch_forum_theme_page);
    register_test!($(#[$meta])*, $api, test_touch_forum_thread_page);
    register_test!($(#[$meta])*, $api, test_touch_forum_thread_page_as_moderator);
    register_test!($(#[$meta])*, $api, test_touch_godchildren);
    register_test!($(#[$meta])*, $api, test_touch_hammerfest_shop);
    register_test!($(#[$meta])*, $api, test_touch_hammerfest_inventory);
  };
}

macro_rules! register_test {
  ($(#[$meta:meta])*, $api:expr, $test_name:ident) => {
    #[tokio::test]
    $(#[$meta])*
    async fn $test_name() {
      crate::test::$test_name($api).await;
    }
  };
}

macro_rules! assert_ok {
  ($result:expr $(,)?) => {{
    match &$result {
      Err(_) => {
        panic!("assertion failed: `result.is_ok()`: {:?}", &$result)
      }
      Ok(()) => {}
    }
  }};
}

pub(crate) struct TestApi<TyClock, TyHammerfestStore>
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  pub(crate) clock: TyClock,
  pub(crate) hammerfest_store: TyHammerfestStore,
}

pub(crate) async fn test_empty<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  let options = GetHammerfestUserOptions {
    server: HammerfestServer::HammerfestFr,
    id: "123".parse().unwrap(),
    time: None,
  };
  let actual = api.hammerfest_store.get_short_user(&options).await.unwrap();
  let expected = None;
  assert_eq!(actual, expected);
}

pub(crate) async fn test_touch_user<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_short_user(&ShortHammerfestUser {
        server: HammerfestServer::HammerfestFr,
        id: "123".parse().unwrap(),
        username: "alice".parse().unwrap(),
      })
      .await
      .unwrap();
    let expected = StoredHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      profile: None,
      items: None,
    };
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .hammerfest_store
      .get_short_user(&GetHammerfestUserOptions {
        server: HammerfestServer::HammerfestFr,
        id: "123".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
    });
    assert_eq!(actual, expected);
  }
  {
    let actual = api
      .hammerfest_store
      .get_user(&GetHammerfestUserOptions {
        server: HammerfestServer::HammerfestFr,
        id: "123".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(StoredHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      profile: None,
      items: None,
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_get_missing_user<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .get_short_user(&GetHammerfestUserOptions {
        server: HammerfestServer::HammerfestFr,
        id: "123".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = None;
    assert_eq!(actual, expected);
  }
  {
    let actual = api
      .hammerfest_store
      .get_user(&GetHammerfestUserOptions {
        server: HammerfestServer::HammerfestFr,
        id: "123".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = None;
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_profile_empty<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: None,
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: None,
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
}

pub(crate) async fn test_touch_matching_profile<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: None,
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: None,
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: None,
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: None,
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
}
pub(crate) async fn test_touch_changed_profile<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: None,
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: None,
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: None,
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: None,
          best_score: 100,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
}
pub(crate) async fn test_change_profile_back<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: None,
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: None,
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: None,
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: None,
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 100,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 2));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: None,
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: None,
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
}

pub(crate) async fn test_touch_profile_with_email<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  let alice = HammerfestSessionUser {
    user: ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    tokens: 50,
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: Some(alice.clone()),
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: Some(Some("alice@example.com".parse().unwrap())),
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
}

pub(crate) async fn test_changed_email<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  let alice = HammerfestSessionUser {
    user: ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    tokens: 50,
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: Some(alice.clone()),
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: Some(Some("alice@example.com".parse().unwrap())),
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: Some(alice.clone()),
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: Some(Some("bob@example.com".parse().unwrap())),
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
}

pub(crate) async fn test_change_email_back<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  let alice = HammerfestSessionUser {
    user: ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    tokens: 50,
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: Some(alice.clone()),
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: Some(Some("alice@example.com".parse().unwrap())),
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: Some(alice.clone()),
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: Some(Some("bob@example.com".parse().unwrap())),
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 2));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: Some(alice.clone()),
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: Some(Some("alice@example.com".parse().unwrap())),
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
}

pub(crate) async fn test_email_uniqueness<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  let alice = HammerfestSessionUser {
    user: ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    tokens: 50,
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: Some(alice.clone()),
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: Some(Some("alice@example.com".parse().unwrap())),
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: Some(alice.clone()),
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "234".parse().unwrap(),
            username: "bob".parse().unwrap(),
          },
          email: Some(Some("alice@example.com".parse().unwrap())),
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 2));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfileResponse {
        session: Some(alice.clone()),
        profile: Some(HammerfestProfile {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "123".parse().unwrap(),
            username: "alice".parse().unwrap(),
          },
          email: Some(Some("alice@example.com".parse().unwrap())),
          best_score: 0,
          best_level: 0,
          has_carrot: false,
          season_score: 0,
          ladder_level: 0.try_into().unwrap(),
          hall_of_fame: None,
          items: Default::default(),
          quests: Default::default(),
        }),
      })
      .await;
    assert_ok!(actual);
  }
}

pub(crate) async fn test_touch_forum_theme_page<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  let alice = HammerfestSessionUser {
    user: ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    tokens: 50,
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let mut threads: Vec<HammerfestForumThread> = Vec::with_capacity(15);
    for i in 0..15 {
      threads.push(HammerfestForumThread {
        short: ShortHammerfestForumThread {
          server: HammerfestServer::HammerfestFr,
          id: format!("{}", 1000 + i).parse().unwrap(),
          name: format!("Thread {}", i).parse().unwrap(),
          is_closed: i % 2 == 0,
        },
        author: ShortHammerfestUser {
          server: HammerfestServer::HammerfestFr,
          id: "127".parse().unwrap(),
          username: "elseabora".parse().unwrap(),
        },
        author_role: HammerfestForumRole::None,
        kind: HammerfestForumThreadKind::Regular {
          latest_post_date: HammerfestDate {
            month: 3,
            day: 5,
            weekday: 5,
          },
        },
        reply_count: 4 * i,
      });
    }

    let actual = api
      .hammerfest_store
      .touch_theme_page(&HammerfestForumThemePageResponse {
        session: Some(alice.clone()),
        page: HammerfestForumThemePage {
          theme: ShortHammerfestForumTheme {
            server: HammerfestServer::HammerfestFr,
            id: "3".parse().unwrap(),
            name: "Les secrets de Tuberculoz".parse().unwrap(),
            is_public: true,
          },
          sticky: vec![HammerfestForumThread {
            short: ShortHammerfestForumThread {
              server: HammerfestServer::HammerfestFr,
              id: "474604".parse().unwrap(),
              name: "[officiel] Corporate Soccer 2".parse().unwrap(),
              is_closed: false,
            },
            author: ShortHammerfestUser {
              server: HammerfestServer::HammerfestFr,
              id: "195".parse().unwrap(),
              username: "deepnight".parse().unwrap(),
            },
            author_role: HammerfestForumRole::Administrator,
            kind: HammerfestForumThreadKind::Sticky,
            reply_count: 0,
          }],
          threads: HammerfestForumThreadListing {
            page1: NonZeroU16::new(1).unwrap(),
            pages: NonZeroU16::new(16).unwrap(),
            items: threads,
          },
        },
      })
      .await;
    assert_ok!(actual);
  }
}

pub(crate) async fn test_touch_forum_thread_page<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_thread_page(&HammerfestForumThreadPageResponse {
        session: None,
        page: HammerfestForumThreadPage {
          theme: ShortHammerfestForumTheme {
            server: HammerfestServer::HammerfestFr,
            id: "3".parse().unwrap(),
            name: "Les secrets de Tuberculoz".parse().unwrap(),
            is_public: true,
          },
          thread: ShortHammerfestForumThread {
            server: HammerfestServer::HammerfestFr,
            id: "474604".parse().unwrap(),
            name: "[officiel] Corporate Soccer 2".parse().unwrap(),
            is_closed: false,
          },
          posts: HammerfestForumPostListing {
            page1: NonZeroU16::new(1).unwrap(),
            pages: NonZeroU16::new(1).unwrap(),
            items: {
              let mut posts: Vec<HammerfestForumPost> = Vec::with_capacity(15);
              for i in 0u8..15 {
                posts.push(HammerfestForumPost {
                  id: None,
                  author: if i % 2 == 0 {
                    HammerfestForumPostAuthor {
                      user: ShortHammerfestUser {
                        server: HammerfestServer::HammerfestFr,
                        id: "195".parse().unwrap(),
                        username: "deepnight".parse().unwrap(),
                      },
                      has_carrot: false,
                      ladder_level: HammerfestLadderLevel::new(2).unwrap(),
                      rank: None,
                      role: HammerfestForumRole::Administrator,
                    }
                  } else {
                    HammerfestForumPostAuthor {
                      user: ShortHammerfestUser {
                        server: HammerfestServer::HammerfestFr,
                        id: format!("{}", 1 + i).parse().unwrap(),
                        username: format!("usr{}", 1 + i).parse().unwrap(),
                      },
                      has_carrot: true,
                      ladder_level: HammerfestLadderLevel::new(1).unwrap(),
                      rank: Some((1 + i).into()),
                      role: HammerfestForumRole::None,
                    }
                  },
                  ctime: HammerfestDateTime {
                    date: HammerfestDate {
                      month: 3,
                      day: 5,
                      weekday: 5,
                    },
                    hour: 0,
                    minute: i,
                  },
                  content: format!("Hello! {}", i),
                });
              }
              posts
            },
          },
        },
      })
      .await;
    assert_ok!(actual);
  }
}

pub(crate) async fn test_touch_forum_thread_page_as_moderator<TyClock, TyHammerfestStore>(
  api: TestApi<TyClock, TyHammerfestStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  let alice = HammerfestSessionUser {
    user: ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    tokens: 50,
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_thread_page(&HammerfestForumThreadPageResponse {
        session: Some(alice),
        page: HammerfestForumThreadPage {
          theme: ShortHammerfestForumTheme {
            server: HammerfestServer::HammerfestFr,
            id: "3".parse().unwrap(),
            name: "Les secrets de Tuberculoz".parse().unwrap(),
            is_public: true,
          },
          thread: ShortHammerfestForumThread {
            server: HammerfestServer::HammerfestFr,
            id: "474604".parse().unwrap(),
            name: "[officiel] Corporate Soccer 2".parse().unwrap(),
            is_closed: false,
          },
          posts: HammerfestForumPostListing {
            page1: NonZeroU16::new(1).unwrap(),
            pages: NonZeroU16::new(1).unwrap(),
            items: {
              let mut posts: Vec<HammerfestForumPost> = Vec::with_capacity(15);
              for i in 0u8..15 {
                posts.push(HammerfestForumPost {
                  id: Some((1 + i).to_string().parse().unwrap()),
                  author: if i % 2 == 0 {
                    HammerfestForumPostAuthor {
                      user: ShortHammerfestUser {
                        server: HammerfestServer::HammerfestFr,
                        id: "195".parse().unwrap(),
                        username: "deepnight".parse().unwrap(),
                      },
                      has_carrot: false,
                      ladder_level: HammerfestLadderLevel::new(2).unwrap(),
                      rank: None,
                      role: HammerfestForumRole::Administrator,
                    }
                  } else {
                    HammerfestForumPostAuthor {
                      user: ShortHammerfestUser {
                        server: HammerfestServer::HammerfestFr,
                        id: format!("{}", 1 + i).parse().unwrap(),
                        username: format!("usr{}", 1 + i).parse().unwrap(),
                      },
                      has_carrot: true,
                      ladder_level: HammerfestLadderLevel::new(1).unwrap(),
                      rank: Some((1 + i).into()),
                      role: HammerfestForumRole::None,
                    }
                  },
                  ctime: HammerfestDateTime {
                    date: HammerfestDate {
                      month: 3,
                      day: 5,
                      weekday: 5,
                    },
                    hour: 0,
                    minute: i,
                  },
                  content: format!("Hello! {}", i),
                });
              }
              posts
            },
          },
        },
      })
      .await;
    assert_ok!(actual);
  }
}

pub(crate) async fn test_touch_godchildren<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  let alice = HammerfestSessionUser {
    user: ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    tokens: 50,
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_godchildren(&HammerfestGodchildrenResponse {
        session: alice.clone(),
        godchildren: vec![],
      })
      .await;
    assert_ok!(actual);
  }

  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .hammerfest_store
      .touch_godchildren(&HammerfestGodchildrenResponse {
        session: alice.clone(),
        godchildren: vec![HammerfestGodchild {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "456".parse().unwrap(),
            username: "bob".parse().unwrap(),
          },
          tokens: 0,
        }],
      })
      .await;
    assert_ok!(actual);
  }

  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .hammerfest_store
      .touch_godchildren(&HammerfestGodchildrenResponse {
        session: alice.clone(),
        godchildren: vec![
          HammerfestGodchild {
            user: ShortHammerfestUser {
              server: HammerfestServer::HammerfestFr,
              id: "456".parse().unwrap(),
              username: "bob".parse().unwrap(),
            },
            tokens: 1,
          },
          HammerfestGodchild {
            user: ShortHammerfestUser {
              server: HammerfestServer::HammerfestFr,
              id: "789".parse().unwrap(),
              username: "charlie".parse().unwrap(),
            },
            tokens: 0,
          },
        ],
      })
      .await;
    assert_ok!(actual);
  }

  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .hammerfest_store
      .touch_godchildren(&HammerfestGodchildrenResponse {
        session: alice.clone(),
        godchildren: vec![HammerfestGodchild {
          user: ShortHammerfestUser {
            server: HammerfestServer::HammerfestFr,
            id: "456".parse().unwrap(),
            username: "bob".parse().unwrap(),
          },
          tokens: 1,
        }],
      })
      .await;
    assert_ok!(actual);
  }

  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .hammerfest_store
      .touch_godchildren(&HammerfestGodchildrenResponse {
        session: alice.clone(),
        godchildren: vec![
          HammerfestGodchild {
            user: ShortHammerfestUser {
              server: HammerfestServer::HammerfestFr,
              id: "456".parse().unwrap(),
              username: "bob".parse().unwrap(),
            },
            tokens: 1,
          },
          HammerfestGodchild {
            user: ShortHammerfestUser {
              server: HammerfestServer::HammerfestFr,
              id: "789".parse().unwrap(),
              username: "charlie".parse().unwrap(),
            },
            tokens: 0,
          },
        ],
      })
      .await;
    assert_ok!(actual);
  }

  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .hammerfest_store
      .touch_godchildren(&HammerfestGodchildrenResponse {
        session: alice.clone(),
        godchildren: vec![
          HammerfestGodchild {
            user: ShortHammerfestUser {
              server: HammerfestServer::HammerfestFr,
              id: "456".parse().unwrap(),
              username: "bob".parse().unwrap(),
            },
            tokens: 2,
          },
          HammerfestGodchild {
            user: ShortHammerfestUser {
              server: HammerfestServer::HammerfestFr,
              id: "789".parse().unwrap(),
              username: "charlie".parse().unwrap(),
            },
            tokens: 2,
          },
        ],
      })
      .await;
    assert_ok!(actual);
  }
}

pub(crate) async fn test_touch_hammerfest_shop<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  let alice = HammerfestSessionUser {
    user: ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    tokens: 50,
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_shop(&HammerfestShopResponse {
        session: alice.clone(),
        shop: HammerfestShop {
          weekly_tokens: 0,
          purchased_tokens: None,
          has_quest_bonus: false,
        },
      })
      .await;
    assert_ok!(actual);
  }

  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .hammerfest_store
      .touch_shop(&HammerfestShopResponse {
        session: alice.clone(),
        shop: HammerfestShop {
          weekly_tokens: 0,
          purchased_tokens: Some(5),
          has_quest_bonus: false,
        },
      })
      .await;
    assert_ok!(actual);
  }

  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .hammerfest_store
      .touch_shop(&HammerfestShopResponse {
        session: alice.clone(),
        shop: HammerfestShop {
          weekly_tokens: 0,
          purchased_tokens: Some(5),
          has_quest_bonus: false,
        },
      })
      .await;
    assert_ok!(actual);
  }

  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .hammerfest_store
      .touch_shop(&HammerfestShopResponse {
        session: alice.clone(),
        shop: HammerfestShop {
          weekly_tokens: 0,
          purchased_tokens: Some(5),
          has_quest_bonus: false,
        },
      })
      .await;
    assert_ok!(actual);
  }
}

pub(crate) async fn test_touch_hammerfest_inventory<TyClock, TyHammerfestStore>(
  api: TestApi<TyClock, TyHammerfestStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
{
  let alice = HammerfestSessionUser {
    user: ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    tokens: 50,
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_inventory(&HammerfestInventoryResponse {
        session: alice.clone(),
        inventory: {
          let mut inventory = HashMap::new();
          inventory.insert("1000".parse().unwrap(), 10);
          inventory
        },
      })
      .await;
    assert_ok!(actual);
  }
}
