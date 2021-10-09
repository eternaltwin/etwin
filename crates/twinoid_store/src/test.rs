use chrono::Duration;
use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::core::Instant;
use etwin_core::twinoid::{ArchivedTwinoidUser, GetTwinoidUserOptions, ShortTwinoidUser, TwinoidStore};

pub(crate) struct TestApi<TyClock, TyTwinoidStore>
where
  TyClock: ApiRef<VirtualClock>,
  TyTwinoidStore: TwinoidStore,
{
  pub(crate) clock: TyClock,
  pub(crate) twinoid_store: TyTwinoidStore,
}

pub(crate) async fn test_empty<TyClock, TyTwinoidStore>(api: TestApi<TyClock, TyTwinoidStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyTwinoidStore: TwinoidStore,
{
  let options = GetTwinoidUserOptions {
    id: "123".parse().unwrap(),
    time: None,
  };
  let actual = api.twinoid_store.get_short_user(&options).await.unwrap();
  let expected = None;
  assert_eq!(actual, expected);
}

pub(crate) async fn test_touch_user<TyClock, TyTwinoidStore>(api: TestApi<TyClock, TyTwinoidStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Instant::ymd_hms(2021, 1, 1, 0, 0, 0));
  {
    let actual = api
      .twinoid_store
      .touch_short_user(&ShortTwinoidUser {
        id: "123".parse().unwrap(),
        display_name: "alice".parse().unwrap(),
      })
      .await
      .unwrap();
    let expected = ArchivedTwinoidUser {
      id: "123".parse().unwrap(),
      display_name: "alice".parse().unwrap(),
      archived_at: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
    };
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .twinoid_store
      .get_short_user(&GetTwinoidUserOptions {
        id: "123".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(ShortTwinoidUser {
      id: "123".parse().unwrap(),
      display_name: "alice".parse().unwrap(),
    });
    assert_eq!(actual, expected);
  }
  {
    let actual = api
      .twinoid_store
      .get_user(&GetTwinoidUserOptions {
        id: "123".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(ArchivedTwinoidUser {
      id: "123".parse().unwrap(),
      display_name: "alice".parse().unwrap(),
      archived_at: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_get_missing_user<TyClock, TyTwinoidStore>(api: TestApi<TyClock, TyTwinoidStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Instant::ymd_hms(2021, 1, 1, 0, 0, 0));
  {
    let actual = api
      .twinoid_store
      .get_short_user(&GetTwinoidUserOptions {
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
      .twinoid_store
      .get_user(&GetTwinoidUserOptions {
        id: "123".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = None;
    assert_eq!(actual, expected);
  }
}
