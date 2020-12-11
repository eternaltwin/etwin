use etwin_core::user::{UserStore, CreateUserOptions, UserDisplayName, UserDisplayNameVersions, UserDisplayNameVersion, Username, CompleteSimpleUser};
use etwin_core::clock::{Clock, VirtualClock};

pub(crate) struct TestApi<'a> {
  pub(crate) clock: &'a VirtualClock,
  pub(crate) user_store: &'a dyn UserStore,
}

// pub(crate) async fn inner_test_user_store<Api>(create_api: fn() -> Api)
//   where Api: Get<Arc<dyn UserStore>> + Get<Arc<dyn Clock>> {
//   test_register_the_admin_and_retrieve_ref(create_api()).await;
//   // test_register_the_admin_and_retrieve_complete(create_api()).await;
// }

pub(crate) async fn test_register_the_admin_and_retrieve_ref(api: TestApi<'_>) {
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
      }
    },
    id: alice.id,
    is_administrator: true,
    ctime: api.clock.now(),
    username: Some(Username::from_str("alice").unwrap()),
    email_address: None,
  };
  assert_eq!(alice, expected);
}
