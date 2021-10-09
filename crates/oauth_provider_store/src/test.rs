use chrono::Duration;
use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::core::Instant;
use etwin_core::oauth::{
  GetOauthClientOptions, OauthClientKeyRef, OauthClientRef, OauthProviderStore, SimpleOauthClient,
  UpsertSystemClientOptions,
};
use etwin_core::password::Password;

#[macro_export]
macro_rules! test_dinoparc_store {
  ($(#[$meta:meta])* || $api:expr) => {
    register_test!($(#[$meta])*, $api, test_create_eternalfest_app);
    register_test!($(#[$meta])*, $api, test_get_eternalfest_app_by_key);
    register_test!($(#[$meta])*, $api, test_create_eternalfest_app_idempotence);
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

pub(crate) struct TestApi<TyClock, TyOauthProviderStore>
where
  TyClock: ApiRef<VirtualClock>,
  TyOauthProviderStore: OauthProviderStore,
{
  pub(crate) clock: TyClock,
  pub(crate) oauth_provider_store: TyOauthProviderStore,
}

pub(crate) async fn test_create_eternalfest_app<TyClock, TyOauthProviderStore>(
  api: TestApi<TyClock, TyOauthProviderStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyOauthProviderStore: OauthProviderStore,
{
  api.clock.as_ref().advance_to(Instant::ymd_hms(2021, 1, 1, 0, 0, 0));
  let options = UpsertSystemClientOptions {
    key: "eternalfest@clients".parse().unwrap(),
    display_name: "Eternalfest".parse().unwrap(),
    app_uri: "https://eternalfest.net".parse().unwrap(),
    callback_uri: "https://eternalfest.net/oauth/callback".parse().unwrap(),
    secret: Password("eternalfest_secret".as_bytes().to_vec()),
  };
  let actual = api.oauth_provider_store.upsert_system_client(&options).await.unwrap();
  let expected = SimpleOauthClient {
    id: actual.id,
    key: Some("eternalfest@clients".parse().unwrap()),
    display_name: "Eternalfest".parse().unwrap(),
    app_uri: "https://eternalfest.net".parse().unwrap(),
    callback_uri: "https://eternalfest.net/oauth/callback".parse().unwrap(),
    owner: None,
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_get_eternalfest_app_by_key<TyClock, TyOauthProviderStore>(
  api: TestApi<TyClock, TyOauthProviderStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyOauthProviderStore: OauthProviderStore,
{
  api.clock.as_ref().advance_to(Instant::ymd_hms(2021, 1, 1, 0, 0, 0));
  {
    let options = UpsertSystemClientOptions {
      key: "eternalfest@clients".parse().unwrap(),
      display_name: "Eternalfest".parse().unwrap(),
      app_uri: "https://eternalfest.net".parse().unwrap(),
      callback_uri: "https://eternalfest.net/oauth/callback".parse().unwrap(),
      secret: Password("eternalfest_secret".as_bytes().to_vec()),
    };
    assert_ok!(api.oauth_provider_store.upsert_system_client(&options).await.map(drop));
  }
  api.clock.as_ref().advance_by(Duration::seconds(1));

  let options = GetOauthClientOptions {
    r#ref: OauthClientRef::Key(OauthClientKeyRef {
      key: "eternalfest@clients".parse().unwrap(),
    }),
  };

  let actual = api.oauth_provider_store.get_client(&options).await.unwrap();
  let expected = SimpleOauthClient {
    id: actual.id,
    key: Some("eternalfest@clients".parse().unwrap()),
    display_name: "Eternalfest".parse().unwrap(),
    app_uri: "https://eternalfest.net".parse().unwrap(),
    callback_uri: "https://eternalfest.net/oauth/callback".parse().unwrap(),
    owner: None,
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_create_eternalfest_app_idempotence<TyClock, TyOauthProviderStore>(
  api: TestApi<TyClock, TyOauthProviderStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyOauthProviderStore: OauthProviderStore,
{
  api.clock.as_ref().advance_to(Instant::ymd_hms(2021, 1, 1, 0, 0, 0));
  let options = UpsertSystemClientOptions {
    key: "eternalfest@clients".parse().unwrap(),
    display_name: "Eternalfest".parse().unwrap(),
    app_uri: "https://eternalfest.net".parse().unwrap(),
    callback_uri: "https://eternalfest.net/oauth/callback".parse().unwrap(),
    secret: Password("eternalfest_secret".as_bytes().to_vec()),
  };
  let first = api.oauth_provider_store.upsert_system_client(&options).await.unwrap();
  let second = api.oauth_provider_store.upsert_system_client(&options).await.unwrap();
  assert_eq!(second, first);
}
