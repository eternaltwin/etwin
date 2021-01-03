use etwin_core::clock::VirtualClock;
use etwin_core::hammerfest::{
  GetHammerfestUserOptions, HammerfestServer, HammerfestStore, HammerfestUserId, HammerfestUsername,
  ShortHammerfestUser,
};
use std::ops::Deref;

pub(crate) struct TestApi<TyClock, TyHammerfestStore>
where
  TyClock: Deref<Target = VirtualClock> + Send + Sync,
  TyHammerfestStore: Deref + Send + Sync,
  <TyHammerfestStore as Deref>::Target: HammerfestStore,
{
  pub(crate) _clock: TyClock,
  pub(crate) hammerfest_store: TyHammerfestStore,
}

pub(crate) async fn test_empty<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: Deref<Target = VirtualClock> + Send + Sync,
  TyHammerfestStore: Deref + Send + Sync,
  <TyHammerfestStore as Deref>::Target: HammerfestStore,
{
  let options = GetHammerfestUserOptions {
    server: HammerfestServer::HammerfestFr,
    id: HammerfestUserId::try_from_string(String::from("123")).unwrap(),
    time: None,
  };
  let actual = api.hammerfest_store.get_short_user(&options).await.unwrap();
  let expected = None;
  assert_eq!(actual, expected);
}

pub(crate) async fn test_touch_user<TyClock, TyHammerfestStore>(api: TestApi<TyClock, TyHammerfestStore>)
where
  TyClock: Deref<Target = VirtualClock> + Send + Sync,
  TyHammerfestStore: Deref + Send + Sync,
  <TyHammerfestStore as Deref>::Target: HammerfestStore,
{
  api
    .hammerfest_store
    .touch_short_user(&ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: HammerfestUserId::try_from_string(String::from("123")).unwrap(),
      username: HammerfestUsername::try_from_string(String::from("alice")).unwrap(),
    })
    .await
    .unwrap();

  let actual = api
    .hammerfest_store
    .get_short_user(&GetHammerfestUserOptions {
      server: HammerfestServer::HammerfestFr,
      id: HammerfestUserId::try_from_string(String::from("123")).unwrap(),
      time: None,
    })
    .await
    .unwrap();
  let expected = Some(ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: HammerfestUserId::try_from_string(String::from("123")).unwrap(),
    username: HammerfestUsername::try_from_string(String::from("alice")).unwrap(),
  });
  assert_eq!(actual, expected);
}

// it("Retrieve an existing Hammerfest user", async function (this: Mocha.Context) {
// this.timeout(30000);
// return withApi(async (api: Api): Promise<void> => {
// await api.hammerfestStore.touchShortUser({type: ObjectType.HammerfestUser, server: "hammerfest.fr", id: "123", username: "alice"});
//
// const actual: ShortHammerfestUser | null = await api.hammerfestStore.getUser({server: "hammerfest.fr", id: "123"});
// {
// const expected: ShortHammerfestUser = {
// type: ObjectType.HammerfestUser,
// server: "hammerfest.fr",
// id: "123",
// username: "alice",
// };
// chai.assert.deepEqual(actual, expected);
// }
// });
// });
//
// it("Retrieve a non-existing Hammerfest user", async function (this: Mocha.Context) {
// this.timeout(30000);
// return withApi(async (api: Api): Promise<void> => {
// await api.hammerfestStore.touchShortUser({type: ObjectType.HammerfestUser, server: "hammerfest.fr", id: "123", username: "alice"});
//
// const actual: ShortHammerfestUser | null = await api.hammerfestStore.getUser({server: "hammerfest.fr", id: "999"});
// {
// const expected: null = null;
// chai.assert.deepEqual(actual, expected);
// }
// });
// });
