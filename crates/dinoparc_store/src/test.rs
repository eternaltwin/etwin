use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::dinoparc::{DinoparcServer, DinoparcStore, DinoparcUserId, GetDinoparcUserOptions};

pub(crate) struct TestApi<TyClock, TyDinoparcStore>
where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
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
