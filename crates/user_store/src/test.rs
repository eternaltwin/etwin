use chrono::{Duration, TimeZone, Utc};
use etwin_core::api::ApiRef;
use etwin_core::clock::{Clock, VirtualClock};
use etwin_core::user::{
  CompleteSimpleUser, CreateUserOptions, GetUserOptions, GetUserResult, ShortUser, SimpleUser, UpdateUserError,
  UpdateUserOptions, UpdateUserPatch, UserDisplayNameVersion, UserDisplayNameVersions, UserFields, UserIdRef, UserRef,
  UserStore, USER_DISPLAY_NAME_LOCK_DURATION,
};

#[macro_export]
macro_rules! test_user_store {
  ($(#[$meta:meta])* || $api:expr) => {
    register_test!($(#[$meta])*, $api, test_create_admin);
    register_test!($(#[$meta])*, $api, test_register_the_admin_and_retrieve_short);
    register_test!($(#[$meta])*, $api, test_register_the_admin_and_retrieve_default);
    register_test!($(#[$meta])*, $api, test_register_the_admin_and_retrieve_complete);
    register_test!($(#[$meta])*, $api, test_update_display_name_after_creation);
    register_test!($(#[$meta])*, $api, test_update_locked_display_name);
    register_test!($(#[$meta])*, $api, test_update_display_after_unlock);
    register_test!($(#[$meta])*, $api, test_update_locked_display_name_after_update);
    register_test!($(#[$meta])*, $api, test_update_display_name_afte_multiple_unlocks);
    register_test!($(#[$meta])*, $api, test_hard_delete_user);
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

pub(crate) struct TestApi<TyClock, TyUserStore>
where
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  pub(crate) clock: TyClock,
  pub(crate) user_store: TyUserStore,
}

pub(crate) async fn test_create_admin<TyClock, TyUserStore>(api: TestApi<TyClock, TyUserStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let actual = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: "Alice".parse().unwrap(),
      username: Some("alice".parse().unwrap()),
      email: None,
      password: None,
    })
    .await
    .unwrap();
  let expected = CompleteSimpleUser {
    id: actual.id,
    display_name: UserDisplayNameVersions {
      current: UserDisplayNameVersion {
        value: "Alice".parse().unwrap(),
      },
    },
    is_administrator: true,
    created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
    username: Some("alice".parse().unwrap()),
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
      display_name: "Alice".parse().unwrap(),
      username: Some("alice".parse().unwrap()),
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
        value: "Alice".parse().unwrap(),
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
      display_name: "Alice".parse().unwrap(),
      username: Some("alice".parse().unwrap()),
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
        value: "Alice".parse().unwrap(),
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
      display_name: "Alice".parse().unwrap(),
      username: Some("alice".parse().unwrap()),
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
        value: "Alice".parse().unwrap(),
      },
    },
    is_administrator: true,
    created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
    username: Some("alice".parse().unwrap()),
    email_address: None,
  }));
  assert_eq!(actual, expected);
}

pub(crate) async fn test_update_display_name_after_creation<TyClock, TyUserStore>(api: TestApi<TyClock, TyUserStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: "Alice".parse().unwrap(),
      username: Some("alice".parse().unwrap()),
      email: None,
      password: None,
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  let actual = api
    .user_store
    .update_user(&UpdateUserOptions {
      r#ref: alice.id.into(),
      actor: alice.id.into(),
      patch: UpdateUserPatch {
        display_name: Some("Alicia".parse().unwrap()),
        username: None,
        password: None,
      },
    })
    .await
    .unwrap();

  let expected = CompleteSimpleUser {
    id: alice.id,
    display_name: UserDisplayNameVersions {
      current: UserDisplayNameVersion {
        value: "Alicia".parse().unwrap(),
      },
    },
    is_administrator: true,
    created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
    username: Some("alice".parse().unwrap()),
    email_address: None,
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_update_locked_display_name<TyClock, TyUserStore>(api: TestApi<TyClock, TyUserStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  let start = Utc.ymd(2021, 1, 1).and_hms(0, 0, 0);
  api.clock.as_ref().advance_to(start);
  let alice = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: "Alice".parse().unwrap(),
      username: Some("alice".parse().unwrap()),
      email: None,
      password: None,
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .user_store
    .update_user(&UpdateUserOptions {
      r#ref: alice.id.into(),
      actor: alice.id.into(),
      patch: UpdateUserPatch {
        display_name: Some("Alicia".parse().unwrap()),
        username: None,
        password: None,
      },
    })
    .await
    .unwrap();

  let lock_start = api.clock.as_ref().now();

  api.clock.as_ref().advance_by(*USER_DISPLAY_NAME_LOCK_DURATION / 2);

  let actual = api
    .user_store
    .update_user(&UpdateUserOptions {
      r#ref: alice.id.into(),
      actor: alice.id.into(),
      patch: UpdateUserPatch {
        display_name: Some("Allison".parse().unwrap()),
        username: None,
        password: None,
      },
    })
    .await;

  let expected = Err(UpdateUserError::LockedDisplayName(
    alice.id.into(),
    (lock_start..(lock_start + *USER_DISPLAY_NAME_LOCK_DURATION)).into(),
    lock_start + *USER_DISPLAY_NAME_LOCK_DURATION / 2,
  ));

  assert_eq!(actual, expected)
}

pub(crate) async fn test_update_display_after_unlock<TyClock, TyUserStore>(api: TestApi<TyClock, TyUserStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: "Alice".parse().unwrap(),
      username: Some("alice".parse().unwrap()),
      email: None,
      password: None,
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .user_store
    .update_user(&UpdateUserOptions {
      r#ref: alice.id.into(),
      actor: alice.id.into(),
      patch: UpdateUserPatch {
        display_name: Some("Alicia".parse().unwrap()),
        username: None,
        password: None,
      },
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(*USER_DISPLAY_NAME_LOCK_DURATION);

  let actual = api
    .user_store
    .update_user(&UpdateUserOptions {
      r#ref: alice.id.into(),
      actor: alice.id.into(),
      patch: UpdateUserPatch {
        display_name: Some("Allison".parse().unwrap()),
        username: None,
        password: None,
      },
    })
    .await
    .unwrap();

  let expected = CompleteSimpleUser {
    id: alice.id,
    display_name: UserDisplayNameVersions {
      current: UserDisplayNameVersion {
        value: "Allison".parse().unwrap(),
      },
    },
    is_administrator: true,
    created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
    username: Some("alice".parse().unwrap()),
    email_address: None,
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_update_locked_display_name_after_update<TyClock, TyUserStore>(
  api: TestApi<TyClock, TyUserStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  let start = Utc.ymd(2021, 1, 1).and_hms(0, 0, 0);
  api.clock.as_ref().advance_to(start);
  let alice = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: "Alice".parse().unwrap(),
      username: Some("alice".parse().unwrap()),
      email: None,
      password: None,
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .user_store
    .update_user(&UpdateUserOptions {
      r#ref: alice.id.into(),
      actor: alice.id.into(),
      patch: UpdateUserPatch {
        display_name: Some("Alicia".parse().unwrap()),
        username: None,
        password: None,
      },
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(*USER_DISPLAY_NAME_LOCK_DURATION);

  api
    .user_store
    .update_user(&UpdateUserOptions {
      r#ref: alice.id.into(),
      actor: alice.id.into(),
      patch: UpdateUserPatch {
        display_name: Some("Allison".parse().unwrap()),
        username: None,
        password: None,
      },
    })
    .await
    .unwrap();

  let lock_start = api.clock.as_ref().now();

  api.clock.as_ref().advance_by(*USER_DISPLAY_NAME_LOCK_DURATION / 2);

  let actual = api
    .user_store
    .update_user(&UpdateUserOptions {
      r#ref: alice.id.into(),
      actor: alice.id.into(),
      patch: UpdateUserPatch {
        display_name: Some("Alexandra".parse().unwrap()),
        username: None,
        password: None,
      },
    })
    .await;

  let expected = Err(UpdateUserError::LockedDisplayName(
    alice.id.into(),
    ((lock_start)..(lock_start + *USER_DISPLAY_NAME_LOCK_DURATION)).into(),
    lock_start + *USER_DISPLAY_NAME_LOCK_DURATION / 2,
  ));

  assert_eq!(actual, expected)
}

pub(crate) async fn test_update_display_name_afte_multiple_unlocks<TyClock, TyUserStore>(
  api: TestApi<TyClock, TyUserStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: "Alice".parse().unwrap(),
      username: Some("alice".parse().unwrap()),
      email: None,
      password: None,
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .user_store
    .update_user(&UpdateUserOptions {
      r#ref: alice.id.into(),
      actor: alice.id.into(),
      patch: UpdateUserPatch {
        display_name: Some("Alicia".parse().unwrap()),
        username: None,
        password: None,
      },
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(*USER_DISPLAY_NAME_LOCK_DURATION);

  api
    .user_store
    .update_user(&UpdateUserOptions {
      r#ref: alice.id.into(),
      actor: alice.id.into(),
      patch: UpdateUserPatch {
        display_name: Some("Allison".parse().unwrap()),
        username: None,
        password: None,
      },
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(*USER_DISPLAY_NAME_LOCK_DURATION);

  let actual = api
    .user_store
    .update_user(&UpdateUserOptions {
      r#ref: alice.id.into(),
      actor: alice.id.into(),
      patch: UpdateUserPatch {
        display_name: Some("Alexandra".parse().unwrap()),
        username: None,
        password: None,
      },
    })
    .await
    .unwrap();

  let expected = CompleteSimpleUser {
    id: alice.id,
    display_name: UserDisplayNameVersions {
      current: UserDisplayNameVersion {
        value: "Alexandra".parse().unwrap(),
      },
    },
    is_administrator: true,
    created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
    username: Some("alice".parse().unwrap()),
    email_address: None,
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_hard_delete_user<TyClock, TyUserStore>(api: TestApi<TyClock, TyUserStore>)
where
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: "Alice".parse().unwrap(),
      username: Some("alice".parse().unwrap()),
      email: None,
      password: None,
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  {
    let actual = api.user_store.hard_delete_user(alice.id.into()).await;
    assert!(actual.is_ok());
  }

  let actual = api
    .user_store
    .get_user(&GetUserOptions {
      fields: UserFields::Short,
      r#ref: UserRef::Id(UserIdRef::new(alice.id)),
      time: None,
    })
    .await
    .unwrap();
  let expected = None;
  assert_eq!(actual, expected);
}
