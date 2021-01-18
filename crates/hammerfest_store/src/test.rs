use chrono::{Duration, TimeZone, Utc};
use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::hammerfest::{
  ArchivedHammerfestUser, GetHammerfestUserOptions, HammerfestServer, HammerfestStore, HammerfestUsername,
  ShortHammerfestUser,
};
use std::str::FromStr;

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
        username: HammerfestUsername::from_str("alice").unwrap(),
      })
      .await
      .unwrap();
    let expected = ArchivedHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: HammerfestUsername::from_str("alice").unwrap(),
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
      username: HammerfestUsername::from_str("alice").unwrap(),
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
    let expected = Some(ArchivedHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: HammerfestUsername::from_str("alice").unwrap(),
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
