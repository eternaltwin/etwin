use etwin_core::clock::{Clock, VirtualClock};
use etwin_core::user::{
  CompleteSimpleUser, CreateUserOptions, UserDisplayName, UserDisplayNameVersion, UserDisplayNameVersions, UserStore,
  Username,
};
use std::ops::Deref;

pub(crate) struct TestApi<TyClock, TyUserStore>
where
  TyClock: Deref<Target = VirtualClock> + Send + Sync,
  TyUserStore: Deref + Send + Sync,
  <TyUserStore as Deref>::Target: UserStore,
{
  pub(crate) clock: TyClock,
  pub(crate) user_store: TyUserStore,
}

// pub(crate) async fn inner_test_user_store<Api>(create_api: fn() -> Api)
//   where Api: Get<Arc<dyn UserStore>> + Get<Arc<dyn Clock>> {
//   test_register_the_admin_and_retrieve_ref(create_api()).await;
//   // test_register_the_admin_and_retrieve_complete(create_api()).await;
// }

pub(crate) async fn test_register_the_admin_and_retrieve_ref<TyClock, TyUserStore>(api: TestApi<TyClock, TyUserStore>)
where
  TyClock: Deref<Target = VirtualClock> + Send + Sync,
  TyUserStore: Deref + Send + Sync,
  <TyUserStore as Deref>::Target: UserStore,
{
  let options = CreateUserOptions {
    display_name: UserDisplayName::from_str("Alice").unwrap(),
    username: Some(Username::from_str("alice").unwrap()),
    email: None,
  };
  let alice = api.user_store.create_user(&options).await.unwrap();
  let expected = CompleteSimpleUser {
    display_name: UserDisplayNameVersions {
      current: UserDisplayNameVersion {
        value: UserDisplayName::from_str("Alice").unwrap(),
      },
    },
    id: alice.id,
    is_administrator: true,
    ctime: api.clock.now(),
    username: Some(Username::from_str("alice").unwrap()),
    email_address: None,
  };
  assert_eq!(alice, expected);
}
