use chrono::{Duration, TimeZone, Utc};
use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::core::{IntPercentage, PeriodLower};
use etwin_core::dinoparc::{
  ArchivedDinoparcDinoz, ArchivedDinoparcUser, DinoparcCollection, DinoparcCollectionResponse, DinoparcDinoz,
  DinoparcDinozElements, DinoparcDinozIdRef, DinoparcDinozRace, DinoparcDinozResponse, DinoparcExchangeWithResponse,
  DinoparcInventoryResponse, DinoparcServer, DinoparcSessionUser, DinoparcSkill, DinoparcSkillLevel, DinoparcStore,
  GetDinoparcDinozOptions, GetDinoparcUserOptions, NamedDinoparcDinozFields, ShortDinoparcDinozWithLevel,
  ShortDinoparcDinozWithLocation, ShortDinoparcUser,
};
use etwin_core::temporal::{ForeignRetrieved, ForeignSnapshot, LatestTemporal};
use std::collections::{HashMap, HashSet};

#[macro_export]
macro_rules! test_dinoparc_store {
  ($(#[$meta:meta])* || $api:expr) => {
    register_test!($(#[$meta])*, $api, test_empty);
  };
}

// TODO: Remove these pg-specific tests: they should be supported by the mem impl too.
#[macro_export]
macro_rules! test_dinoparc_store_pg {
  ($(#[$meta:meta])* || $api:expr) => {
    register_test!($(#[$meta])*, $api, test_touch_inventory_no_dinoz);
    register_test!($(#[$meta])*, $api, test_touch_inventory_one_dinoz);
    register_test!($(#[$meta])*, $api, test_touch_inventory_three_dinoz);
    register_test!($(#[$meta])*, $api, test_touch_collection_one_dinoz);
    register_test!($(#[$meta])*, $api, test_touch_collection_jonathan);
    register_test!($(#[$meta])*, $api, test_touch_dinoz_yasumi);
    register_test!($(#[$meta])*, $api, test_touch_dinoz_king_kong);
    register_test!($(#[$meta])*, $api, test_touch_exchange_with_none_admin);
    register_test!($(#[$meta])*, $api, test_touch_exchange_with_extra);
    register_test!($(#[$meta])*, $api, test_touch_exchange_with_extra_then_drop_some);
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

pub(crate) struct TestApi<TyClock, TyDinoparcStore>
where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
{
  pub(crate) clock: TyClock,
  pub(crate) dinoparc_store: TyDinoparcStore,
}

pub(crate) async fn test_empty<TyClock, TyDinoparcStore>(api: TestApi<TyClock, TyDinoparcStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
{
  let options = GetDinoparcUserOptions {
    server: DinoparcServer::DinoparcCom,
    id: "123".parse().unwrap(),
    time: None,
  };
  let actual = api.dinoparc_store.get_user(&options).await.unwrap();
  let expected = None;
  assert_eq!(actual, expected);
}

pub(crate) async fn test_touch_inventory_no_dinoz<TyClock, TyDinoparcStore>(api: TestApi<TyClock, TyDinoparcStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
{
  let alice = DinoparcSessionUser {
    user: ShortDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    coins: 10000,
    dinoz: Vec::new(),
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .dinoparc_store
      .touch_inventory(&DinoparcInventoryResponse {
        session_user: alice.clone(),
        inventory: {
          let mut inventory = HashMap::new();
          inventory.insert("1".parse().unwrap(), 10);
          inventory
        },
      })
      .await;
    assert_ok!(actual);
  }
}

pub(crate) async fn test_touch_inventory_one_dinoz<TyClock, TyDinoparcStore>(api: TestApi<TyClock, TyDinoparcStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
{
  let alice = DinoparcSessionUser {
    user: ShortDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    coins: 10000,
    dinoz: vec![ShortDinoparcDinozWithLocation {
      server: DinoparcServer::DinoparcCom,
      id: "2".parse().unwrap(),
      name: Some("Balboa".parse().unwrap()),
      location: Some("3".parse().unwrap()),
    }],
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .dinoparc_store
      .touch_inventory(&DinoparcInventoryResponse {
        session_user: alice.clone(),
        inventory: {
          let mut inventory = HashMap::new();
          inventory.insert("4".parse().unwrap(), 10);
          inventory
        },
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .dinoparc_store
      .get_user(&GetDinoparcUserOptions {
        server: DinoparcServer::DinoparcCom,
        id: "1".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(ArchivedDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      username: "alice".parse().unwrap(),
      coins: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: 10000,
        },
      }),
      inventory: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: {
            let mut inventory = HashMap::new();
            inventory.insert("4".parse().unwrap(), 10);
            inventory
          },
        },
      }),
      collection: None,
      dinoz: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: vec![DinoparcDinozIdRef {
            server: DinoparcServer::DinoparcCom,
            id: "2".parse().unwrap(),
          }],
        },
      }),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_inventory_three_dinoz<TyClock, TyDinoparcStore>(api: TestApi<TyClock, TyDinoparcStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
{
  let alice = DinoparcSessionUser {
    user: ShortDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    coins: 10000,
    dinoz: vec![
      ShortDinoparcDinozWithLocation {
        server: DinoparcServer::DinoparcCom,
        id: "2".parse().unwrap(),
        name: Some("One".parse().unwrap()),
        location: Some("3".parse().unwrap()),
      },
      ShortDinoparcDinozWithLocation {
        server: DinoparcServer::DinoparcCom,
        id: "4".parse().unwrap(),
        name: Some("Two".parse().unwrap()),
        location: Some("5".parse().unwrap()),
      },
      ShortDinoparcDinozWithLocation {
        server: DinoparcServer::DinoparcCom,
        id: "6".parse().unwrap(),
        name: Some("Three".parse().unwrap()),
        location: Some("7".parse().unwrap()),
      },
    ],
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .dinoparc_store
      .touch_inventory(&DinoparcInventoryResponse {
        session_user: alice.clone(),
        inventory: {
          let mut inventory = HashMap::new();
          inventory.insert("4".parse().unwrap(), 10);
          inventory
        },
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .dinoparc_store
      .get_user(&GetDinoparcUserOptions {
        server: DinoparcServer::DinoparcCom,
        id: "1".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(ArchivedDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      username: "alice".parse().unwrap(),
      coins: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: 10000,
        },
      }),
      inventory: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: {
            let mut inventory = HashMap::new();
            inventory.insert("4".parse().unwrap(), 10);
            inventory
          },
        },
      }),
      collection: None,
      dinoz: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: vec![
            DinoparcDinozIdRef {
              server: DinoparcServer::DinoparcCom,
              id: "2".parse().unwrap(),
            },
            DinoparcDinozIdRef {
              server: DinoparcServer::DinoparcCom,
              id: "4".parse().unwrap(),
            },
            DinoparcDinozIdRef {
              server: DinoparcServer::DinoparcCom,
              id: "6".parse().unwrap(),
            },
          ],
        },
      }),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_collection_one_dinoz<TyClock, TyDinoparcStore>(api: TestApi<TyClock, TyDinoparcStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
{
  let alice = DinoparcSessionUser {
    user: ShortDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    coins: 10000,
    dinoz: vec![ShortDinoparcDinozWithLocation {
      server: DinoparcServer::DinoparcCom,
      id: "2".parse().unwrap(),
      name: Some("Balboa".parse().unwrap()),
      location: Some("3".parse().unwrap()),
    }],
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .dinoparc_store
      .touch_collection(&DinoparcCollectionResponse {
        session_user: alice.clone(),
        collection: DinoparcCollection {
          rewards: {
            let mut rewards = HashSet::new();
            rewards.insert("4".parse().unwrap());
            rewards
          },
          epic_rewards: {
            let mut rewards = HashSet::new();
            rewards.insert("adn".parse().unwrap());
            rewards
          },
        },
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .dinoparc_store
      .get_user(&GetDinoparcUserOptions {
        server: DinoparcServer::DinoparcCom,
        id: "1".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(ArchivedDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      username: "alice".parse().unwrap(),
      coins: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: 10000,
        },
      }),
      inventory: None,
      collection: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: DinoparcCollection {
            rewards: {
              let mut rewards = HashSet::new();
              rewards.insert("4".parse().unwrap());
              rewards
            },
            epic_rewards: {
              let mut rewards = HashSet::new();
              rewards.insert("adn".parse().unwrap());
              rewards
            },
          },
        },
      }),
      dinoz: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: vec![DinoparcDinozIdRef {
            server: DinoparcServer::DinoparcCom,
            id: "2".parse().unwrap(),
          }],
        },
      }),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_collection_jonathan<TyClock, TyDinoparcStore>(api: TestApi<TyClock, TyDinoparcStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
{
  let alice = DinoparcSessionUser {
    user: ShortDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    coins: 10000,
    dinoz: vec![ShortDinoparcDinozWithLocation {
      server: DinoparcServer::DinoparcCom,
      id: "2".parse().unwrap(),
      name: Some("Balboa".parse().unwrap()),
      location: Some("3".parse().unwrap()),
    }],
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .dinoparc_store
      .touch_collection(&DinoparcCollectionResponse {
        session_user: alice.clone(),
        collection: DinoparcCollection {
          rewards: {
            let mut rewards = HashSet::new();
            rewards.insert("2".parse().unwrap());
            rewards.insert("3".parse().unwrap());
            rewards.insert("6".parse().unwrap());
            rewards.insert("9".parse().unwrap());
            rewards.insert("12".parse().unwrap());
            rewards.insert("15".parse().unwrap());
            rewards.insert("16".parse().unwrap());
            rewards.insert("17".parse().unwrap());
            rewards.insert("18".parse().unwrap());
            rewards.insert("19".parse().unwrap());
            rewards.insert("20".parse().unwrap());
            rewards.insert("21".parse().unwrap());
            rewards.insert("22".parse().unwrap());
            rewards.insert("23".parse().unwrap());
            rewards.insert("24".parse().unwrap());
            rewards.insert("25".parse().unwrap());
            rewards.insert("26".parse().unwrap());
            rewards.insert("27".parse().unwrap());
            rewards.insert("28".parse().unwrap());
            rewards.insert("29".parse().unwrap());
            rewards.insert("30".parse().unwrap());
            rewards.insert("31".parse().unwrap());
            rewards.insert("32".parse().unwrap());
            rewards.insert("33".parse().unwrap());
            rewards.insert("34".parse().unwrap());
            rewards.insert("35".parse().unwrap());
            rewards.insert("36".parse().unwrap());
            rewards.insert("37".parse().unwrap());
            rewards.insert("38".parse().unwrap());
            rewards.insert("39".parse().unwrap());
            rewards.insert("40".parse().unwrap());
            rewards.insert("41".parse().unwrap());
            rewards.insert("42".parse().unwrap());
            rewards.insert("43".parse().unwrap());
            rewards.insert("44".parse().unwrap());
            rewards.insert("45".parse().unwrap());
            rewards.insert("46".parse().unwrap());
            rewards.insert("47".parse().unwrap());
            rewards.insert("48".parse().unwrap());
            rewards.insert("49".parse().unwrap());
            rewards
          },
          epic_rewards: {
            let mut rewards = HashSet::new();
            rewards.insert("adn".parse().unwrap());
            rewards.insert("beer".parse().unwrap());
            rewards.insert("globe_bronze".parse().unwrap());
            rewards.insert("globe_charbon".parse().unwrap());
            rewards.insert("kabuki".parse().unwrap());
            rewards.insert("letter".parse().unwrap());
            rewards.insert("scroll2".parse().unwrap());
            rewards.insert("star_full".parse().unwrap());
            rewards.insert("war18b".parse().unwrap());
            rewards.insert("war29b".parse().unwrap());
            rewards.insert("war31b".parse().unwrap());
            rewards.insert("war32a".parse().unwrap());
            rewards.insert("war32b".parse().unwrap());
            rewards.insert("war_stone10".parse().unwrap());
            rewards.insert("war_stone11".parse().unwrap());
            rewards.insert("war_stone8".parse().unwrap());
            rewards
          },
        },
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .dinoparc_store
      .get_user(&GetDinoparcUserOptions {
        server: DinoparcServer::DinoparcCom,
        id: "1".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(ArchivedDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      username: "alice".parse().unwrap(),
      coins: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: 10000,
        },
      }),
      inventory: None,
      collection: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: DinoparcCollection {
            rewards: {
              let mut rewards = HashSet::new();
              rewards.insert("2".parse().unwrap());
              rewards.insert("3".parse().unwrap());
              rewards.insert("6".parse().unwrap());
              rewards.insert("9".parse().unwrap());
              rewards.insert("12".parse().unwrap());
              rewards.insert("15".parse().unwrap());
              rewards.insert("16".parse().unwrap());
              rewards.insert("17".parse().unwrap());
              rewards.insert("18".parse().unwrap());
              rewards.insert("19".parse().unwrap());
              rewards.insert("20".parse().unwrap());
              rewards.insert("21".parse().unwrap());
              rewards.insert("22".parse().unwrap());
              rewards.insert("23".parse().unwrap());
              rewards.insert("24".parse().unwrap());
              rewards.insert("25".parse().unwrap());
              rewards.insert("26".parse().unwrap());
              rewards.insert("27".parse().unwrap());
              rewards.insert("28".parse().unwrap());
              rewards.insert("29".parse().unwrap());
              rewards.insert("30".parse().unwrap());
              rewards.insert("31".parse().unwrap());
              rewards.insert("32".parse().unwrap());
              rewards.insert("33".parse().unwrap());
              rewards.insert("34".parse().unwrap());
              rewards.insert("35".parse().unwrap());
              rewards.insert("36".parse().unwrap());
              rewards.insert("37".parse().unwrap());
              rewards.insert("38".parse().unwrap());
              rewards.insert("39".parse().unwrap());
              rewards.insert("40".parse().unwrap());
              rewards.insert("41".parse().unwrap());
              rewards.insert("42".parse().unwrap());
              rewards.insert("43".parse().unwrap());
              rewards.insert("44".parse().unwrap());
              rewards.insert("45".parse().unwrap());
              rewards.insert("46".parse().unwrap());
              rewards.insert("47".parse().unwrap());
              rewards.insert("48".parse().unwrap());
              rewards.insert("49".parse().unwrap());
              rewards
            },
            epic_rewards: {
              let mut rewards = HashSet::new();
              rewards.insert("adn".parse().unwrap());
              rewards.insert("beer".parse().unwrap());
              rewards.insert("globe_bronze".parse().unwrap());
              rewards.insert("globe_charbon".parse().unwrap());
              rewards.insert("kabuki".parse().unwrap());
              rewards.insert("letter".parse().unwrap());
              rewards.insert("scroll2".parse().unwrap());
              rewards.insert("star_full".parse().unwrap());
              rewards.insert("war18b".parse().unwrap());
              rewards.insert("war29b".parse().unwrap());
              rewards.insert("war31b".parse().unwrap());
              rewards.insert("war32a".parse().unwrap());
              rewards.insert("war32b".parse().unwrap());
              rewards.insert("war_stone10".parse().unwrap());
              rewards.insert("war_stone11".parse().unwrap());
              rewards.insert("war_stone8".parse().unwrap());
              rewards
            },
          },
        },
      }),
      dinoz: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: vec![DinoparcDinozIdRef {
            server: DinoparcServer::DinoparcCom,
            id: "2".parse().unwrap(),
          }],
        },
      }),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_dinoz_yasumi<TyClock, TyDinoparcStore>(api: TestApi<TyClock, TyDinoparcStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
{
  let alice = DinoparcSessionUser {
    user: ShortDinoparcUser {
      server: DinoparcServer::EnDinoparcCom,
      id: "681579".parse().unwrap(),
      username: "Kapox".parse().unwrap(),
    },
    coins: 527051,
    dinoz: vec![
      ShortDinoparcDinozWithLocation {
        server: DinoparcServer::EnDinoparcCom,
        id: "765483".parse().unwrap(),
        name: Some("Yasumi".parse().unwrap()),
        location: Some("0".parse().unwrap()),
      },
      ShortDinoparcDinozWithLocation {
        server: DinoparcServer::EnDinoparcCom,
        id: "765484".parse().unwrap(),
        name: Some("Manaka".parse().unwrap()),
        location: Some("1".parse().unwrap()),
      },
    ],
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .dinoparc_store
      .touch_dinoz(&DinoparcDinozResponse {
        session_user: alice.clone(),
        dinoz: DinoparcDinoz {
          server: DinoparcServer::EnDinoparcCom,
          id: "765483".parse().unwrap(),
          race: DinoparcDinozRace::Wanwan,
          skin: "Ac9OrgxOWu1pd7Fp".parse().unwrap(),
          level: 12,
          named: Some(NamedDinoparcDinozFields {
            name: "Yasumi".parse().unwrap(),
            location: "0".parse().unwrap(),
            life: IntPercentage::new(30).unwrap(),
            experience: IntPercentage::new(13).unwrap(),
            danger: 116,
            in_tournament: false,
            elements: DinoparcDinozElements {
              fire: 10,
              earth: 0,
              water: 0,
              thunder: 7,
              air: 2,
            },
            skills: {
              let mut skills = HashMap::new();
              skills.insert(DinoparcSkill::Dexterity, DinoparcSkillLevel::new(2).unwrap());
              skills.insert(DinoparcSkill::Intelligence, DinoparcSkillLevel::new(5).unwrap());
              skills.insert(DinoparcSkill::Strength, DinoparcSkillLevel::new(5).unwrap());
              skills.insert(DinoparcSkill::MartialArts, DinoparcSkillLevel::new(5).unwrap());
              skills
            },
          }),
        },
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .dinoparc_store
      .get_dinoz(&GetDinoparcDinozOptions {
        server: DinoparcServer::EnDinoparcCom,
        id: "765483".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(ArchivedDinoparcDinoz {
      server: DinoparcServer::EnDinoparcCom,
      id: "765483".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      name: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: Some("Yasumi".parse().unwrap()),
        },
      }),
      owner: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: ShortDinoparcUser {
            server: DinoparcServer::EnDinoparcCom,
            id: "681579".parse().unwrap(),
            username: "Kapox".parse().unwrap(),
          },
        },
      }),
      location: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: "0".parse().unwrap(),
        },
      }),
      race: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: DinoparcDinozRace::Wanwan,
        },
      }),
      skin: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: "Ac9OrgxOWu1pd7Fp".parse().unwrap(),
        },
      }),
      life: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: IntPercentage::new(30).unwrap(),
        },
      }),
      level: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: 12,
        },
      }),
      experience: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: IntPercentage::new(13).unwrap(),
        },
      }),
      danger: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: 116,
        },
      }),
      in_tournament: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: false,
        },
      }),
      elements: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: DinoparcDinozElements {
            fire: 10,
            earth: 0,
            water: 0,
            thunder: 7,
            air: 2,
          },
        },
      }),
      skills: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: {
            let mut skills = HashMap::new();
            skills.insert(DinoparcSkill::Dexterity, DinoparcSkillLevel::new(2).unwrap());
            skills.insert(DinoparcSkill::Intelligence, DinoparcSkillLevel::new(5).unwrap());
            skills.insert(DinoparcSkill::Strength, DinoparcSkillLevel::new(5).unwrap());
            skills.insert(DinoparcSkill::MartialArts, DinoparcSkillLevel::new(5).unwrap());
            skills
          },
        },
      }),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_dinoz_king_kong<TyClock, TyDinoparcStore>(api: TestApi<TyClock, TyDinoparcStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
{
  let alice = DinoparcSessionUser {
    user: ShortDinoparcUser {
      server: DinoparcServer::EnDinoparcCom,
      id: "58144".parse().unwrap(),
      username: "josum41".parse().unwrap(),
    },
    coins: 4927,
    dinoz: vec![ShortDinoparcDinozWithLocation {
      server: DinoparcServer::EnDinoparcCom,
      id: "299930".parse().unwrap(),
      name: Some("King-Kong".parse().unwrap()),
      location: Some("20".parse().unwrap()),
    }],
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .dinoparc_store
      .touch_dinoz(&DinoparcDinozResponse {
        session_user: alice.clone(),
        dinoz: DinoparcDinoz {
          server: DinoparcServer::EnDinoparcCom,
          id: "299930".parse().unwrap(),
          race: DinoparcDinozRace::Gorilloz,
          skin: "5I3Qvg92CQLxvGE4".parse().unwrap(),
          level: 25,
          named: Some(NamedDinoparcDinozFields {
            name: "King-Kong".parse().unwrap(),
            location: "20".parse().unwrap(),
            life: IntPercentage::new(18).unwrap(),
            experience: IntPercentage::new(27).unwrap(),
            danger: -65,
            in_tournament: false,
            elements: DinoparcDinozElements {
              fire: 2,
              earth: 19,
              water: 17,
              thunder: 13,
              air: 4,
            },
            skills: {
              let mut skills = HashMap::new();
              skills.insert(DinoparcSkill::Bargain, DinoparcSkillLevel::new(2).unwrap());
              skills.insert(DinoparcSkill::Climb, DinoparcSkillLevel::new(5).unwrap());
              skills.insert(DinoparcSkill::Dexterity, DinoparcSkillLevel::new(2).unwrap());
              skills.insert(DinoparcSkill::Dig, DinoparcSkillLevel::new(5).unwrap());
              skills.insert(DinoparcSkill::Intelligence, DinoparcSkillLevel::new(5).unwrap());
              skills.insert(DinoparcSkill::Medicine, DinoparcSkillLevel::new(4).unwrap());
              skills.insert(DinoparcSkill::Perception, DinoparcSkillLevel::new(2).unwrap());
              skills.insert(DinoparcSkill::Run, DinoparcSkillLevel::new(1).unwrap());
              skills.insert(DinoparcSkill::Stamina, DinoparcSkillLevel::new(4).unwrap());
              skills
            },
          }),
        },
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .dinoparc_store
      .get_dinoz(&GetDinoparcDinozOptions {
        server: DinoparcServer::EnDinoparcCom,
        id: "299930".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(ArchivedDinoparcDinoz {
      server: DinoparcServer::EnDinoparcCom,
      id: "299930".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      name: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: Some("King-Kong".parse().unwrap()),
        },
      }),
      owner: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: ShortDinoparcUser {
            server: DinoparcServer::EnDinoparcCom,
            id: "58144".parse().unwrap(),
            username: "josum41".parse().unwrap(),
          },
        },
      }),
      location: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: "20".parse().unwrap(),
        },
      }),
      race: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: DinoparcDinozRace::Gorilloz,
        },
      }),
      skin: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: "5I3Qvg92CQLxvGE4".parse().unwrap(),
        },
      }),
      life: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: IntPercentage::new(18).unwrap(),
        },
      }),
      level: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: 25,
        },
      }),
      experience: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: IntPercentage::new(27).unwrap(),
        },
      }),
      danger: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: -65,
        },
      }),
      in_tournament: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: false,
        },
      }),
      elements: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: DinoparcDinozElements {
            fire: 2,
            earth: 19,
            water: 17,
            thunder: 13,
            air: 4,
          },
        },
      }),
      skills: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: {
            let mut skills = HashMap::new();
            skills.insert(DinoparcSkill::Bargain, DinoparcSkillLevel::new(2).unwrap());
            skills.insert(DinoparcSkill::Climb, DinoparcSkillLevel::new(5).unwrap());
            skills.insert(DinoparcSkill::Dexterity, DinoparcSkillLevel::new(2).unwrap());
            skills.insert(DinoparcSkill::Dig, DinoparcSkillLevel::new(5).unwrap());
            skills.insert(DinoparcSkill::Intelligence, DinoparcSkillLevel::new(5).unwrap());
            skills.insert(DinoparcSkill::Medicine, DinoparcSkillLevel::new(4).unwrap());
            skills.insert(DinoparcSkill::Perception, DinoparcSkillLevel::new(2).unwrap());
            skills.insert(DinoparcSkill::Run, DinoparcSkillLevel::new(1).unwrap());
            skills.insert(DinoparcSkill::Stamina, DinoparcSkillLevel::new(4).unwrap());
            skills
          },
        },
      }),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_exchange_with_none_admin<TyClock, TyDinoparcStore>(
  api: TestApi<TyClock, TyDinoparcStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
{
  let alice = DinoparcSessionUser {
    user: ShortDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    coins: 10000,
    dinoz: Vec::new(),
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .dinoparc_store
      .touch_exchange_with(&DinoparcExchangeWithResponse {
        session_user: alice.clone(),
        own_bills: 1,
        own_dinoz: Vec::new(),
        other_user: ShortDinoparcUser {
          server: DinoparcServer::DinoparcCom,
          id: "0".parse().unwrap(),
          username: "admin".parse().unwrap(),
        },
        other_dinoz: vec![ShortDinoparcDinozWithLevel {
          server: DinoparcServer::DinoparcCom,
          id: "2".parse().unwrap(),
          name: Some("Balboa".parse().unwrap()),
          level: 1,
        }],
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .dinoparc_store
      .get_user(&GetDinoparcUserOptions {
        server: DinoparcServer::DinoparcCom,
        id: "1".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(ArchivedDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      username: "alice".parse().unwrap(),
      coins: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: 10000,
        },
      }),
      inventory: None,
      collection: None,
      dinoz: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: Vec::new(),
        },
      }),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_exchange_with_extra<TyClock, TyDinoparcStore>(api: TestApi<TyClock, TyDinoparcStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
{
  let alice = DinoparcSessionUser {
    user: ShortDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    coins: 10000,
    dinoz: {
      let mut list = Vec::new();
      for i in 0..150 {
        list.push(ShortDinoparcDinozWithLocation {
          server: DinoparcServer::DinoparcCom,
          id: format!("{}", i).parse().unwrap(),
          name: Some(format!("Dino{}", i).parse().unwrap()),
          location: Some("0".parse().unwrap()),
        })
      }
      list
    },
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .dinoparc_store
      .touch_exchange_with(&DinoparcExchangeWithResponse {
        session_user: alice.clone(),
        own_bills: 1,
        own_dinoz: {
          let mut list = Vec::new();
          for i in 0..160 {
            list.push(ShortDinoparcDinozWithLevel {
              server: DinoparcServer::DinoparcCom,
              id: format!("{}", i).parse().unwrap(),
              name: Some(format!("Dino{}", i).parse().unwrap()),
              level: 1,
            })
          }
          list
        },
        other_user: ShortDinoparcUser {
          server: DinoparcServer::DinoparcCom,
          id: "0".parse().unwrap(),
          username: "admin".parse().unwrap(),
        },
        other_dinoz: Vec::new(),
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .dinoparc_store
      .get_user(&GetDinoparcUserOptions {
        server: DinoparcServer::DinoparcCom,
        id: "1".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(ArchivedDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      username: "alice".parse().unwrap(),
      coins: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: 10000,
        },
      }),
      inventory: None,
      collection: None,
      dinoz: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: {
            let mut list = Vec::new();
            for i in 0..160 {
              list.push(DinoparcDinozIdRef {
                server: DinoparcServer::DinoparcCom,
                id: format!("{}", i).parse().unwrap(),
              })
            }
            list
          },
        },
      }),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_exchange_with_extra_then_drop_some<TyClock, TyDinoparcStore>(
  api: TestApi<TyClock, TyDinoparcStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
{
  let alice = DinoparcSessionUser {
    user: ShortDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      username: "alice".parse().unwrap(),
    },
    coins: 10000,
    dinoz: {
      let mut list = Vec::new();
      for i in 0..150 {
        list.push(ShortDinoparcDinozWithLocation {
          server: DinoparcServer::DinoparcCom,
          id: format!("{}", i).parse().unwrap(),
          name: Some(format!("Dino{}", i).parse().unwrap()),
          location: Some("0".parse().unwrap()),
        })
      }
      list
    },
  };
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  {
    let actual = api
      .dinoparc_store
      .touch_exchange_with(&DinoparcExchangeWithResponse {
        session_user: alice.clone(),
        own_bills: 1,
        own_dinoz: {
          let mut list = Vec::new();
          for i in 0..160 {
            list.push(ShortDinoparcDinozWithLevel {
              server: DinoparcServer::DinoparcCom,
              id: format!("{}", i).parse().unwrap(),
              name: Some(format!("Dino{}", i).parse().unwrap()),
              level: 1,
            })
          }
          list
        },
        other_user: ShortDinoparcUser {
          server: DinoparcServer::DinoparcCom,
          id: "0".parse().unwrap(),
          username: "admin".parse().unwrap(),
        },
        other_dinoz: Vec::new(),
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .dinoparc_store
      .touch_inventory(&DinoparcInventoryResponse {
        session_user: DinoparcSessionUser {
          dinoz: {
            let mut list = Vec::new();
            for i in 20..170 {
              list.push(ShortDinoparcDinozWithLocation {
                server: DinoparcServer::DinoparcCom,
                id: format!("{}", i).parse().unwrap(),
                name: Some(format!("Dino{}", i).parse().unwrap()),
                location: Some("0".parse().unwrap()),
              })
            }
            list
          },
          ..alice.clone()
        },
        inventory: HashMap::new(),
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .dinoparc_store
      .get_user(&GetDinoparcUserOptions {
        server: DinoparcServer::DinoparcCom,
        id: "1".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(ArchivedDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      username: "alice".parse().unwrap(),
      coins: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
          },
          value: 10000,
        },
      }),
      inventory: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
          },
          value: HashMap::new(),
        },
      }),
      collection: None,
      dinoz: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
          },
          value: {
            let mut list = Vec::new();
            for i in 0..160 {
              list.push(DinoparcDinozIdRef {
                server: DinoparcServer::DinoparcCom,
                id: format!("{}", i).parse().unwrap(),
              })
            }
            list
          },
        },
      }),
    });
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .dinoparc_store
      .touch_inventory(&DinoparcInventoryResponse {
        session_user: DinoparcSessionUser {
          dinoz: {
            let mut list = Vec::new();
            for i in 21..170 {
              list.push(ShortDinoparcDinozWithLocation {
                server: DinoparcServer::DinoparcCom,
                id: format!("{}", i).parse().unwrap(),
                name: Some(format!("Dino{}", i).parse().unwrap()),
                location: Some("0".parse().unwrap()),
              })
            }
            list
          },
          ..alice
        },
        inventory: HashMap::new(),
      })
      .await;
    assert_ok!(actual);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .dinoparc_store
      .get_user(&GetDinoparcUserOptions {
        server: DinoparcServer::DinoparcCom,
        id: "1".parse().unwrap(),
        time: None,
      })
      .await
      .unwrap();
    let expected = Some(ArchivedDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      username: "alice".parse().unwrap(),
      coins: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
          },
          value: 10000,
        },
      }),
      inventory: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 1)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
          },
          value: HashMap::new(),
        },
      }),
      collection: None,
      dinoz: Some(LatestTemporal {
        latest: ForeignSnapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 3)),
          retrieved: ForeignRetrieved {
            latest: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
          },
          value: {
            let mut list = Vec::new();
            for i in 21..170 {
              list.push(DinoparcDinozIdRef {
                server: DinoparcServer::DinoparcCom,
                id: format!("{}", i).parse().unwrap(),
              })
            }
            list
          },
        },
      }),
    });
    assert_eq!(actual, expected);
  }
}
