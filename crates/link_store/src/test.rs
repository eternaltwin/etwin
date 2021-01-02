use etwin_core::clock::VirtualClock;
use std::ops::Deref;
use etwin_core::hammerfest::{HammerfestStore, GetHammerfestUserOptions, HammerfestServer, HammerfestUserId, ShortHammerfestUser, HammerfestUsername, HammerfestUserIdRef};
use etwin_core::link::{LinkStore, GetLinkOptions, VersionedRawLink};

pub(crate) struct TestApi<TyClock, TyHammerfestStore, TyLinkStore>
  where
    TyClock: Deref<Target=VirtualClock> + Send + Sync,
    TyHammerfestStore: Deref + Send + Sync,
    <TyHammerfestStore as Deref>::Target: HammerfestStore,
    TyLinkStore: Deref + Send + Sync,
    <TyLinkStore as Deref>::Target: LinkStore,
{
  pub(crate) _clock: TyClock,
  pub(crate) hammerfest_store: TyHammerfestStore,
  pub(crate) link_store: TyLinkStore,
}

pub(crate) async fn test_empty<TyClock, TyHammerfestStore, TyLinkStore>(api: TestApi<TyClock, TyHammerfestStore, TyLinkStore>)
  where
    TyClock: Deref<Target=VirtualClock> + Send + Sync,
    TyHammerfestStore: Deref + Send + Sync,
    <TyHammerfestStore as Deref>::Target: HammerfestStore,
    TyLinkStore: Deref + Send + Sync,
    <TyLinkStore as Deref>::Target: LinkStore,
{
  api.hammerfest_store.touch_short_user(&ShortHammerfestUser {
    server: HammerfestServer::HammerfestFr,
    id: HammerfestUserId::try_from_string(String::from("123")).unwrap(),
    username: HammerfestUsername::try_from_string(String::from("alice")).unwrap(),
  }).await.unwrap();

  let actual = api.link_store.get_link_from_hammerfest(&GetLinkOptions {
    remote: HammerfestUserIdRef {
      server: HammerfestServer::HammerfestFr,
      id: HammerfestUserId::try_from_string(String::from("123")).unwrap(),
    },
    time: None,
  }).await.unwrap();
  let expected: VersionedRawLink<HammerfestUserIdRef> = VersionedRawLink {
    current: None,
    old: vec![],
  };
  assert_eq!(actual, expected);
}
