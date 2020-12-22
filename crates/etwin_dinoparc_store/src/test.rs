use etwin_core::clock::VirtualClock;
use std::ops::Deref;
use etwin_core::dinoparc::{DinoparcStore, GetDinoparcUserOptions, DinoparcServer, DinoparcUserId};

pub(crate) struct TestApi<TyClock, TyDinoparcStore>
  where
    TyClock: Deref<Target=VirtualClock> + Send + Sync,
    TyDinoparcStore: Deref + Send + Sync,
    <TyDinoparcStore as Deref>::Target: DinoparcStore,
{
  pub(crate) _clock: TyClock,
  pub(crate) dinoparc_store: TyDinoparcStore,
}

// pub(crate) async fn inner_test_user_store<Api>(create_api: fn() -> Api)
//   where Api: Get<Arc<dyn UserStore>> + Get<Arc<dyn Clock>> {
//   test_register_the_admin_and_retrieve_ref(create_api()).await;
//   // test_register_the_admin_and_retrieve_complete(create_api()).await;
// }

pub(crate) async fn test_empty<TyClock, TyDinoparcStore>(api: TestApi<TyClock, TyDinoparcStore>)
  where
    TyClock: Deref<Target=VirtualClock> + Send + Sync,
    TyDinoparcStore: Deref + Send + Sync,
    <TyDinoparcStore as Deref>::Target: DinoparcStore,
{
  let options = GetDinoparcUserOptions {
    server: DinoparcServer::DinoparcCom,
    id: DinoparcUserId::try_from_string(String::from("123")).unwrap(),
    time: None,
  };
  let actual = api.dinoparc_store.get_short_user(&options).await.unwrap();
  let expected = None;
  assert_eq!(actual, expected);
}
