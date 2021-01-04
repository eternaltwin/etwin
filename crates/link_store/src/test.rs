use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::hammerfest::{
  GetHammerfestUserOptions, HammerfestServer, HammerfestStore, HammerfestUserId, HammerfestUserIdRef,
  HammerfestUsername, ShortHammerfestUser,
};
use etwin_core::link::{GetLinkOptions, LinkStore, VersionedRawLink};

pub(crate) struct TestApi<TyClock, TyHammerfestStore, TyLinkStore>
where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
{
  pub(crate) _clock: TyClock,
  pub(crate) hammerfest_store: TyHammerfestStore,
  pub(crate) link_store: TyLinkStore,
}

pub(crate) async fn test_empty<TyClock, TyHammerfestStore, TyLinkStore>(
  api: TestApi<TyClock, TyHammerfestStore, TyLinkStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
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
    .link_store
    .get_link_from_hammerfest(&GetLinkOptions {
      remote: HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: HammerfestUserId::try_from_string(String::from("123")).unwrap(),
      },
      time: None,
    })
    .await
    .unwrap();
  let expected: VersionedRawLink<HammerfestUserIdRef> = VersionedRawLink {
    current: None,
    old: vec![],
  };
  assert_eq!(actual, expected);
}
