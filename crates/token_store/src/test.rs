use chrono::{Duration, TimeZone, Utc};
use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::dinoparc::{
  DinoparcServer, DinoparcStore, DinoparcUserIdRef, ShortDinoparcUser, StoredDinoparcSession,
};
use etwin_core::hammerfest::{
  HammerfestServer, HammerfestStore, HammerfestUserIdRef, ShortHammerfestUser, StoredHammerfestSession,
};
use etwin_core::oauth::{TwinoidAccessToken, TwinoidRefreshToken};
use etwin_core::token::{TokenStore, TouchOauthTokenOptions, TwinoidOauth};
use etwin_core::twinoid::{ShortTwinoidUser, TwinoidStore, TwinoidUserId};
use std::str::FromStr;

#[macro_export]
macro_rules! test_token_store {
  ($(#[$meta:meta])* || $api:expr) => {
    register_test!($(#[$meta])*, $api, test_touch_twinoid_oauth);
    register_test!($(#[$meta])*, $api, test_touch_twinoid_oauth_twice);
    register_test!($(#[$meta])*, $api, test_revoke_twinoid_access_token);
    register_test!($(#[$meta])*, $api, test_revoke_twinoid_refresh_token);
    register_test!($(#[$meta])*, $api, test_touch_hammerfest_session);
    register_test!($(#[$meta])*, $api, test_touch_hammerfest_session_to_update_atime_but_not_ctime);
    register_test!($(#[$meta])*, $api, test_touch_hammerfest_session_and_retrieve_it_without_atime_change);
    register_test!($(#[$meta])*, $api, test_returns_none_for_session_with_an_unknown_hammerfest_user);
    register_test!($(#[$meta])*, $api, test_returns_none_for_session_with_a_known_unauthenticated_hammerfest_user);
    register_test!($(#[$meta])*, $api, test_returns_none_for_a_revoked_hammerfest_session);
    register_test!($(#[$meta])*, $api, test_touch_revoke_touch_hammerfest_session_same_user);
    register_test!($(#[$meta])*, $api, test_touch_revoke_touch_hammerfest_session_different_user);
    register_test!($(#[$meta])*, $api, test_touch_hammerfest_session_again_with_different_user_without_revoking_first);
    register_test!($(#[$meta])*, $api, test_touch_multiple_hammerfest_sessions_with_same_user);
    register_test!($(#[$meta])*, $api, test_touch_hammerfest_session_causing_auto_revocation_of_both_other_key_and_user);
    register_test!($(#[$meta])*, $api, test_touch_dinoparc_session);
    register_test!($(#[$meta])*, $api, test_touch_dinoparc_session_to_update_atime_but_not_ctime);
    register_test!($(#[$meta])*, $api, test_touch_dinoparc_session_and_retrieve_it_without_atime_change);
    register_test!($(#[$meta])*, $api, test_returns_none_for_session_with_an_unknown_dinoparc_user);
    register_test!($(#[$meta])*, $api, test_returns_none_for_session_with_a_known_unauthenticated_dinoparc_user);
    register_test!($(#[$meta])*, $api, test_returns_none_for_a_revoked_dinoparc_session);
    register_test!($(#[$meta])*, $api, test_touch_revoke_touch_dinoparc_session_same_user);
    register_test!($(#[$meta])*, $api, test_touch_revoke_touch_dinoparc_session_different_user);
    register_test!($(#[$meta])*, $api, test_touch_dinoparc_session_again_with_different_user_without_revoking_first);
    register_test!($(#[$meta])*, $api, test_touch_multiple_dinoparc_sessions_with_same_user);
    register_test!($(#[$meta])*, $api, test_touch_dinoparc_session_causing_auto_revocation_of_both_other_key_and_user);
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

pub(crate) struct TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>
where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  pub(crate) clock: TyClock,
  pub(crate) dinoparc_store: TyDinoparcStore,
  pub(crate) hammerfest_store: TyHammerfestStore,
  pub(crate) token_store: TyTokenStore,
  pub(crate) twinoid_store: TyTwinoidStore,
}

pub(crate) async fn test_touch_twinoid_oauth<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  api
    .twinoid_store
    .touch_short_user(&ShortTwinoidUser {
      id: "1".parse().unwrap(),
      display_name: "alice".parse().unwrap(),
    })
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_twinoid_oauth(&TouchOauthTokenOptions {
      access_token: "X6nhMR2zwwfLNOR6EoQ9cM03BI3i66Q6".parse().unwrap(),
      refresh_token: "HfznfQUg1C2p87ESIp6WRq945ppG6swD".parse().unwrap(),
      expiration_time: Utc.ymd(2021, 1, 1).and_hms(1, 0, 0),
      twinoid_user_id: "1".parse().unwrap(),
    })
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api
    .token_store
    .get_twinoid_oauth(TwinoidUserId::from_str("1").unwrap().as_ref())
    .await
    .unwrap();
  let expected = TwinoidOauth {
    access_token: Some(TwinoidAccessToken {
      key: "X6nhMR2zwwfLNOR6EoQ9cM03BI3i66Q6".parse().unwrap(),
      created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
      accessed_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
      expires_at: Utc.ymd(2021, 1, 1).and_hms(1, 0, 0),
      twinoid_user_id: "1".parse().unwrap(),
    }),
    refresh_token: Some(TwinoidRefreshToken {
      key: "HfznfQUg1C2p87ESIp6WRq945ppG6swD".parse().unwrap(),
      created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
      accessed_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
      twinoid_user_id: "1".parse().unwrap(),
    }),
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_touch_twinoid_oauth_twice<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  api
    .twinoid_store
    .touch_short_user(&ShortTwinoidUser {
      id: "1".parse().unwrap(),
      display_name: "alice".parse().unwrap(),
    })
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_twinoid_oauth(&TouchOauthTokenOptions {
      access_token: "X6nhMR2zwwfLNOR6EoQ9cM03BI3i66Q6".parse().unwrap(),
      refresh_token: "HfznfQUg1C2p87ESIp6WRq945ppG6swD".parse().unwrap(),
      expiration_time: Utc.ymd(2021, 1, 1).and_hms(1, 0, 0),
      twinoid_user_id: "1".parse().unwrap(),
    })
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_twinoid_oauth(&TouchOauthTokenOptions {
      access_token: "BD8AdH420AukbvExGxL5KcJNrdRMK80s".parse().unwrap(),
      refresh_token: "HfznfQUg1C2p87ESIp6WRq945ppG6swD".parse().unwrap(),
      expiration_time: Utc.ymd(2021, 1, 1).and_hms(2, 0, 0),
      twinoid_user_id: "1".parse().unwrap(),
    })
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api
    .token_store
    .get_twinoid_oauth(TwinoidUserId::from_str("1").unwrap().as_ref())
    .await
    .unwrap();
  let expected = TwinoidOauth {
    access_token: Some(TwinoidAccessToken {
      key: "BD8AdH420AukbvExGxL5KcJNrdRMK80s".parse().unwrap(),
      created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
      accessed_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
      expires_at: Utc.ymd(2021, 1, 1).and_hms(2, 0, 0),
      twinoid_user_id: "1".parse().unwrap(),
    }),
    refresh_token: Some(TwinoidRefreshToken {
      key: "HfznfQUg1C2p87ESIp6WRq945ppG6swD".parse().unwrap(),
      created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
      accessed_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
      twinoid_user_id: "1".parse().unwrap(),
    }),
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_revoke_twinoid_access_token<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  api
    .twinoid_store
    .touch_short_user(&ShortTwinoidUser {
      id: "1".parse().unwrap(),
      display_name: "alice".parse().unwrap(),
    })
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_twinoid_oauth(&TouchOauthTokenOptions {
      access_token: "X6nhMR2zwwfLNOR6EoQ9cM03BI3i66Q6".parse().unwrap(),
      refresh_token: "HfznfQUg1C2p87ESIp6WRq945ppG6swD".parse().unwrap(),
      expiration_time: Utc.ymd(2021, 1, 1).and_hms(1, 0, 0),
      twinoid_user_id: "1".parse().unwrap(),
    })
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .revoke_twinoid_access_token(&"X6nhMR2zwwfLNOR6EoQ9cM03BI3i66Q6".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api
    .token_store
    .get_twinoid_oauth(TwinoidUserId::from_str("1").unwrap().as_ref())
    .await
    .unwrap();
  let expected = TwinoidOauth {
    access_token: None,
    refresh_token: Some(TwinoidRefreshToken {
      key: "HfznfQUg1C2p87ESIp6WRq945ppG6swD".parse().unwrap(),
      created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
      accessed_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
      twinoid_user_id: "1".parse().unwrap(),
    }),
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_revoke_twinoid_refresh_token<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  api
    .twinoid_store
    .touch_short_user(&ShortTwinoidUser {
      id: "1".parse().unwrap(),
      display_name: "alice".parse().unwrap(),
    })
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_twinoid_oauth(&TouchOauthTokenOptions {
      access_token: "X6nhMR2zwwfLNOR6EoQ9cM03BI3i66Q6".parse().unwrap(),
      refresh_token: "HfznfQUg1C2p87ESIp6WRq945ppG6swD".parse().unwrap(),
      expiration_time: Utc.ymd(2021, 1, 1).and_hms(1, 0, 0),
      twinoid_user_id: "1".parse().unwrap(),
    })
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .revoke_twinoid_refresh_token(&"HfznfQUg1C2p87ESIp6WRq945ppG6swD".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api
    .token_store
    .get_twinoid_oauth(TwinoidUserId::from_str("1").unwrap().as_ref())
    .await
    .unwrap();
  let expected = TwinoidOauth {
    access_token: Some(TwinoidAccessToken {
      key: "X6nhMR2zwwfLNOR6EoQ9cM03BI3i66Q6".parse().unwrap(),
      created_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
      accessed_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
      expires_at: Utc.ymd(2021, 1, 1).and_hms(1, 0, 0),
      twinoid_user_id: "1".parse().unwrap(),
    }),
    refresh_token: None,
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_touch_hammerfest_session<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.hammerfest_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api
    .token_store
    .touch_hammerfest(
      HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "1".parse().unwrap(),
      },
      &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    )
    .await
    .unwrap();
  let expected = StoredHammerfestSession {
    key: "aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    user: alice.as_ref(),
    ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
    atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_touch_hammerfest_session_to_update_atime_but_not_ctime<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.hammerfest_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_hammerfest(
      HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "1".parse().unwrap(),
      },
      &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    )
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api
    .token_store
    .touch_hammerfest(
      HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "1".parse().unwrap(),
      },
      &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    )
    .await
    .unwrap();
  let expected = StoredHammerfestSession {
    key: "aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    user: alice.as_ref(),
    ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
    atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_touch_hammerfest_session_and_retrieve_it_without_atime_change<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.hammerfest_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_hammerfest(
      HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "1".parse().unwrap(),
      },
      &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    )
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api.token_store.get_hammerfest(alice.as_ref()).await.unwrap();
  let expected = Some(StoredHammerfestSession {
    key: "aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    user: alice.as_ref(),
    ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
    atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
  });
  assert_eq!(actual, expected);
}

pub(crate) async fn test_returns_none_for_session_with_an_unknown_hammerfest_user<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let actual = api
    .token_store
    .get_hammerfest(HammerfestUserIdRef {
      server: HammerfestServer::HammerfestFr,
      id: "1".parse().unwrap(),
    })
    .await
    .unwrap();
  let expected = None;
  assert_eq!(actual, expected);
}

pub(crate) async fn test_returns_none_for_session_with_a_known_unauthenticated_hammerfest_user<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.hammerfest_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api.token_store.get_hammerfest(alice.as_ref()).await.unwrap();
  let expected = None;
  assert_eq!(actual, expected);
}

pub(crate) async fn test_returns_none_for_a_revoked_hammerfest_session<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.hammerfest_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_hammerfest(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .revoke_hammerfest(alice.server, &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api.token_store.get_hammerfest(alice.as_ref()).await.unwrap();
  let expected = None;
  assert_eq!(actual, expected);
}

pub(crate) async fn test_touch_revoke_touch_hammerfest_session_same_user<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.hammerfest_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_hammerfest(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .revoke_hammerfest(alice.server, &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .token_store
      .touch_hammerfest(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
      .await
      .unwrap();
    let expected = StoredHammerfestSession {
      key: "aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
      user: alice.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
    };
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_hammerfest(alice.as_ref()).await.unwrap();
    let expected = Some(StoredHammerfestSession {
      key: "aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
      user: alice.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_revoke_touch_hammerfest_session_different_user<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.hammerfest_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let bob = ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: "2".parse().unwrap(),
    username: "bob".parse().unwrap(),
  };
  api.hammerfest_store.touch_short_user(&bob).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_hammerfest(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .revoke_hammerfest(alice.server, &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .token_store
      .touch_hammerfest(bob.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
      .await
      .unwrap();
    let expected = StoredHammerfestSession {
      key: "aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
      user: bob.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
    };
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_hammerfest(alice.as_ref()).await.unwrap();
    let expected = None;
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_hammerfest(bob.as_ref()).await.unwrap();
    let expected = Some(StoredHammerfestSession {
      key: "aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
      user: bob.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_hammerfest_session_again_with_different_user_without_revoking_first<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.hammerfest_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let bob = ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: "2".parse().unwrap(),
    username: "bob".parse().unwrap(),
  };
  api.hammerfest_store.touch_short_user(&bob).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_hammerfest(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .token_store
      .touch_hammerfest(bob.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
      .await
      .unwrap();
    let expected = StoredHammerfestSession {
      key: "aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
      user: bob.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
    };
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_hammerfest(alice.as_ref()).await.unwrap();
    let expected = None;
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_hammerfest(bob.as_ref()).await.unwrap();
    let expected = Some(StoredHammerfestSession {
      key: "aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
      user: bob.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_multiple_hammerfest_sessions_with_same_user<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.hammerfest_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_hammerfest(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .token_store
      .touch_hammerfest(alice.as_ref(), &"bbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap())
      .await
      .unwrap();
    let expected = StoredHammerfestSession {
      key: "bbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap(),
      user: alice.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
    };
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_hammerfest(alice.as_ref()).await.unwrap();
    let expected = Some(StoredHammerfestSession {
      key: "bbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap(),
      user: alice.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_hammerfest_session_causing_auto_revocation_of_both_other_key_and_user<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.hammerfest_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let bob = ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: "2".parse().unwrap(),
    username: "bob".parse().unwrap(),
  };
  api.hammerfest_store.touch_short_user(&bob).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_hammerfest(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_hammerfest(bob.as_ref(), &"bbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .token_store
      .touch_hammerfest(alice.as_ref(), &"bbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap())
      .await
      .unwrap();
    let expected = StoredHammerfestSession {
      key: "bbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap(),
      user: alice.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
    };
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_hammerfest(alice.as_ref()).await.unwrap();
    let expected = Some(StoredHammerfestSession {
      key: "bbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap(),
      user: alice.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
    });
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_hammerfest(bob.as_ref()).await.unwrap();
    let expected = None;
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_dinoparc_session<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortDinoparcUser {
    server: DinoparcServer::DinoparcCom,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.dinoparc_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api
    .token_store
    .touch_dinoparc(
      DinoparcUserIdRef {
        server: DinoparcServer::DinoparcCom,
        id: "1".parse().unwrap(),
      },
      &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    )
    .await
    .unwrap();
  let expected = StoredDinoparcSession {
    key: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    user: alice.as_ref(),
    ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
    atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_touch_dinoparc_session_to_update_atime_but_not_ctime<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortDinoparcUser {
    server: DinoparcServer::DinoparcCom,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.dinoparc_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_dinoparc(
      DinoparcUserIdRef {
        server: DinoparcServer::DinoparcCom,
        id: "1".parse().unwrap(),
      },
      &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    )
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api
    .token_store
    .touch_dinoparc(
      DinoparcUserIdRef {
        server: DinoparcServer::DinoparcCom,
        id: "1".parse().unwrap(),
      },
      &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    )
    .await
    .unwrap();
  let expected = StoredDinoparcSession {
    key: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    user: alice.as_ref(),
    ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
    atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_touch_dinoparc_session_and_retrieve_it_without_atime_change<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortDinoparcUser {
    server: DinoparcServer::DinoparcCom,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.dinoparc_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_dinoparc(
      DinoparcUserIdRef {
        server: DinoparcServer::DinoparcCom,
        id: "1".parse().unwrap(),
      },
      &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    )
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api.token_store.get_dinoparc(alice.as_ref()).await.unwrap();
  let expected = Some(StoredDinoparcSession {
    key: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
    user: alice.as_ref(),
    ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
    atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
  });
  assert_eq!(actual, expected);
}

pub(crate) async fn test_returns_none_for_session_with_an_unknown_dinoparc_user<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let actual = api
    .token_store
    .get_dinoparc(DinoparcUserIdRef {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
    })
    .await
    .unwrap();
  let expected = None;
  assert_eq!(actual, expected);
}

pub(crate) async fn test_returns_none_for_session_with_a_known_unauthenticated_dinoparc_user<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortDinoparcUser {
    server: DinoparcServer::DinoparcCom,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.dinoparc_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api.token_store.get_dinoparc(alice.as_ref()).await.unwrap();
  let expected = None;
  assert_eq!(actual, expected);
}

pub(crate) async fn test_returns_none_for_a_revoked_dinoparc_session<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortDinoparcUser {
    server: DinoparcServer::DinoparcCom,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.dinoparc_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_dinoparc(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .revoke_dinoparc(alice.server, &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api.token_store.get_dinoparc(alice.as_ref()).await.unwrap();
  let expected = None;
  assert_eq!(actual, expected);
}

pub(crate) async fn test_touch_revoke_touch_dinoparc_session_same_user<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortDinoparcUser {
    server: DinoparcServer::DinoparcCom,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.dinoparc_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_dinoparc(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .revoke_dinoparc(alice.server, &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .token_store
      .touch_dinoparc(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
      .await
      .unwrap();
    let expected = StoredDinoparcSession {
      key: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
      user: alice.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
    };
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_dinoparc(alice.as_ref()).await.unwrap();
    let expected = Some(StoredDinoparcSession {
      key: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
      user: alice.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_revoke_touch_dinoparc_session_different_user<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortDinoparcUser {
    server: DinoparcServer::DinoparcCom,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.dinoparc_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let bob = ShortDinoparcUser {
    server: DinoparcServer::DinoparcCom,
    id: "2".parse().unwrap(),
    username: "bob".parse().unwrap(),
  };
  api.dinoparc_store.touch_short_user(&bob).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_dinoparc(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .revoke_dinoparc(alice.server, &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .token_store
      .touch_dinoparc(bob.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
      .await
      .unwrap();
    let expected = StoredDinoparcSession {
      key: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
      user: bob.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
    };
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_dinoparc(alice.as_ref()).await.unwrap();
    let expected = None;
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_dinoparc(bob.as_ref()).await.unwrap();
    let expected = Some(StoredDinoparcSession {
      key: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
      user: bob.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_dinoparc_session_again_with_different_user_without_revoking_first<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortDinoparcUser {
    server: DinoparcServer::DinoparcCom,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.dinoparc_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let bob = ShortDinoparcUser {
    server: DinoparcServer::DinoparcCom,
    id: "2".parse().unwrap(),
    username: "bob".parse().unwrap(),
  };
  api.dinoparc_store.touch_short_user(&bob).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_dinoparc(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .token_store
      .touch_dinoparc(bob.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
      .await
      .unwrap();
    let expected = StoredDinoparcSession {
      key: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
      user: bob.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
    };
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_dinoparc(alice.as_ref()).await.unwrap();
    let expected = None;
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_dinoparc(bob.as_ref()).await.unwrap();
    let expected = Some(StoredDinoparcSession {
      key: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap(),
      user: bob.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 3),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_multiple_dinoparc_sessions_with_same_user<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortDinoparcUser {
    server: DinoparcServer::DinoparcCom,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.dinoparc_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_dinoparc(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .token_store
      .touch_dinoparc(alice.as_ref(), &"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap())
      .await
      .unwrap();
    let expected = StoredDinoparcSession {
      key: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap(),
      user: alice.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
    };
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_dinoparc(alice.as_ref()).await.unwrap();
    let expected = Some(StoredDinoparcSession {
      key: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap(),
      user: alice.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
    });
    assert_eq!(actual, expected);
  }
}

pub(crate) async fn test_touch_dinoparc_session_causing_auto_revocation_of_both_other_key_and_user<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyTokenStore,
  TyTwinoidStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyTokenStore, TyTwinoidStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyTokenStore: TokenStore,
  TyTwinoidStore: TwinoidStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice = ShortDinoparcUser {
    server: DinoparcServer::DinoparcCom,
    id: "1".parse().unwrap(),
    username: "alice".parse().unwrap(),
  };
  api.dinoparc_store.touch_short_user(&alice).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let bob = ShortDinoparcUser {
    server: DinoparcServer::DinoparcCom,
    id: "2".parse().unwrap(),
    username: "bob".parse().unwrap(),
  };
  api.dinoparc_store.touch_short_user(&bob).await.unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_dinoparc(alice.as_ref(), &"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  api
    .token_store
    .touch_dinoparc(bob.as_ref(), &"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap())
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api
      .token_store
      .touch_dinoparc(alice.as_ref(), &"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap())
      .await
      .unwrap();
    let expected = StoredDinoparcSession {
      key: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap(),
      user: alice.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
    };
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_dinoparc(alice.as_ref()).await.unwrap();
    let expected = Some(StoredDinoparcSession {
      key: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".parse().unwrap(),
      user: alice.as_ref(),
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 4),
    });
    assert_eq!(actual, expected);
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));
  {
    let actual = api.token_store.get_dinoparc(bob.as_ref()).await.unwrap();
    let expected = None;
    assert_eq!(actual, expected);
  }
}
