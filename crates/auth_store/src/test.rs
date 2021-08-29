use chrono::{Duration, TimeZone, Utc};
use etwin_core::api::ApiRef;
use etwin_core::auth::{AuthStore, CreateSessionOptions, RawSession};
use etwin_core::clock::VirtualClock;
use etwin_core::user::{CreateUserOptions, UserStore};

#[macro_export]
macro_rules! test_dinoparc_store {
  ($(#[$meta:meta])* || $api:expr) => {
    register_test!($(#[$meta])*, $api, test_create_session);
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

pub(crate) struct TestApi<TyAuthStore, TyClock, TyUserStore>
where
  TyAuthStore: AuthStore,
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  pub(crate) auth_store: TyAuthStore,
  pub(crate) clock: TyClock,
  pub(crate) user_store: TyUserStore,
}

pub(crate) async fn test_create_session<TyAuthStore, TyClock, TyUserStore>(
  api: TestApi<TyAuthStore, TyClock, TyUserStore>,
) where
  TyAuthStore: AuthStore,
  TyClock: ApiRef<VirtualClock>,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let user = api
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
    .auth_store
    .create_session(&CreateSessionOptions { user: user.id.into() })
    .await
    .unwrap();
  let expected = RawSession {
    id: actual.id,
    user: user.id.into(),
    ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
    atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
  };
  assert_eq!(actual, expected);
}
