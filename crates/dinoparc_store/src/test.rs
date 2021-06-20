use chrono::{TimeZone, Utc};
use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::core::IntPercentage;
use etwin_core::dinoparc::{
  DinoparcDinoz, DinoparcDinozElements, DinoparcDinozRace, DinoparcDinozResponse, DinoparcInventoryResponse,
  DinoparcServer, DinoparcSessionUser, DinoparcSkill, DinoparcSkillLevel, DinoparcStore, GetDinoparcUserOptions,
  ShortDinoparcDinoz, ShortDinoparcUser,
};
use std::collections::HashMap;

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
    register_test!($(#[$meta])*, $api, test_touch_dinoz_yasumi);
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
  let actual = api.dinoparc_store.get_short_user(&options).await.unwrap();
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
    dinoz: vec![ShortDinoparcDinoz {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      name: "Balboa".parse().unwrap(),
      location: "1".parse().unwrap(),
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
          inventory.insert("1".parse().unwrap(), 10);
          inventory
        },
      })
      .await;
    assert_ok!(actual);
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
      ShortDinoparcDinoz {
        server: DinoparcServer::EnDinoparcCom,
        id: "765483".parse().unwrap(),
        name: "Yasumi".parse().unwrap(),
        location: "0".parse().unwrap(),
      },
      ShortDinoparcDinoz {
        server: DinoparcServer::EnDinoparcCom,
        id: "765484".parse().unwrap(),
        name: "Manaka".parse().unwrap(),
        location: "1".parse().unwrap(),
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
          name: "Yasumi".parse().unwrap(),
          location: "0".parse().unwrap(),
          race: DinoparcDinozRace::Wanwan,
          skin: "Ac9OrgxOWu1pd7Fp".parse().unwrap(),
          life: IntPercentage::new(30).unwrap(),
          level: 12,
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
        },
      })
      .await;
    assert_ok!(actual);
  }
}
