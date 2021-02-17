use chrono::{TimeZone, Utc};
use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::user::{
  CompleteSimpleUser, CreateUserOptions, GetUserOptions, GetUserResult, ShortUser, SimpleUser, UserDisplayName,
  UserDisplayNameVersion, UserDisplayNameVersions, UserFields, UserIdRef, UserRef, UserStore, Username,
};
use std::str::FromStr;

pub(crate) struct TestApi<TyClock, TyUserStore>
where
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  pub(crate) clock: TyClock,
  pub(crate) user_store: TyUserStore,
}

// pub(crate) async fn inner_test_user_store<Api>(create_api: fn() -> Api)
//   where Api: Get<Arc<dyn UserStore>> + Get<Arc<dyn Clock>> {
//   test_register_the_admin_and_retrieve_ref(create_api()).await;
//   // test_register_the_admin_and_retrieve_complete(create_api()).await;
// }

pub(crate) async fn test_create_admin<TyClock, TyUserStore>(api: TestApi<TyClock, TyUserStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let actual = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: UserDisplayName::from_str("Alice").unwrap(),
      username: Some(Username::from_str("alice").unwrap()),
      email: None,
      password: None,
    })
    .await
    .unwrap();
  let expected = CompleteSimpleUser {
    id: actual.id,
    display_name: UserDisplayNameVersions {
      current: UserDisplayNameVersion {
        value: UserDisplayName::from_str("Alice").unwrap(),
      },
    },
    is_administrator: true,
    created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
    username: Some(Username::from_str("alice").unwrap()),
    email_address: None,
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_register_the_admin_and_retrieve_short<TyClock, TyUserStore>(api: TestApi<TyClock, TyUserStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: UserDisplayName::from_str("Alice").unwrap(),
      username: Some(Username::from_str("alice").unwrap()),
      email: None,
      password: None,
    })
    .await
    .unwrap();
  let actual = api
    .user_store
    .get_user(&GetUserOptions {
      fields: UserFields::Short,
      r#ref: UserRef::Id(UserIdRef::new(alice.id)),
      time: None,
    })
    .await
    .unwrap();
  let expected = Some(GetUserResult::Short(ShortUser {
    id: alice.id,
    display_name: UserDisplayNameVersions {
      current: UserDisplayNameVersion {
        value: UserDisplayName::from_str("Alice").unwrap(),
      },
    },
  }));
  assert_eq!(actual, expected);
}

pub(crate) async fn test_register_the_admin_and_retrieve_default<TyClock, TyUserStore>(
  api: TestApi<TyClock, TyUserStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: UserDisplayName::from_str("Alice").unwrap(),
      username: Some(Username::from_str("alice").unwrap()),
      email: None,
      password: None,
    })
    .await
    .unwrap();
  let actual = api
    .user_store
    .get_user(&GetUserOptions {
      fields: UserFields::Default,
      r#ref: UserRef::Id(UserIdRef::new(alice.id)),
      time: None,
    })
    .await
    .unwrap();
  let expected = Some(GetUserResult::Default(SimpleUser {
    id: alice.id,
    created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
    display_name: UserDisplayNameVersions {
      current: UserDisplayNameVersion {
        value: UserDisplayName::from_str("Alice").unwrap(),
      },
    },
    is_administrator: true,
  }));
  assert_eq!(actual, expected);
}

pub(crate) async fn test_register_the_admin_and_retrieve_complete<TyClock, TyUserStore>(
  api: TestApi<TyClock, TyUserStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: UserDisplayName::from_str("Alice").unwrap(),
      username: Some(Username::from_str("alice").unwrap()),
      email: None,
      password: None,
    })
    .await
    .unwrap();
  let actual = api
    .user_store
    .get_user(&GetUserOptions {
      fields: UserFields::Complete,
      r#ref: UserRef::Id(UserIdRef::new(alice.id)),
      time: None,
    })
    .await
    .unwrap();
  let expected = Some(GetUserResult::Complete(CompleteSimpleUser {
    id: alice.id,
    display_name: UserDisplayNameVersions {
      current: UserDisplayNameVersion {
        value: UserDisplayName::from_str("Alice").unwrap(),
      },
    },
    is_administrator: true,
    created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
    username: Some(Username::from_str("alice").unwrap()),
    email_address: None,
  }));
  assert_eq!(actual, expected);
}
