use chrono::{Duration, TimeZone, Utc};
use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::hammerfest::{
  GetHammerfestUserOptions, HammerfestDate, HammerfestForumRole, HammerfestForumThemePage, HammerfestForumThread,
  HammerfestForumThreadKind, HammerfestForumThreadListing, HammerfestProfile, HammerfestServer, HammerfestStore,
  ShortHammerfestForumTheme, ShortHammerfestForumThread, ShortHammerfestUser, StoredHammerfestUser,
};
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
      .touch_profile(&HammerfestProfile {
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
      .touch_profile(&HammerfestProfile {
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
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfile {
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
      .touch_profile(&HammerfestProfile {
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
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfile {
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
      .touch_profile(&HammerfestProfile {
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
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfile {
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
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 2));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfile {
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
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfile {
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
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfile {
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
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfile {
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
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfile {
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
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfile {
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
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 2));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfile {
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
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfile {
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
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfile {
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
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 2));
  {
    let actual = api
      .hammerfest_store
      .touch_profile(&HammerfestProfile {
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
          last_message_date: HammerfestDate {
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
      .touch_theme_page(&HammerfestForumThemePage {
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
      })
      .await;
    assert_ok!(actual);
  }
}
