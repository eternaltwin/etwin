use chrono::{Duration, TimeZone, Utc};
use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::core::RawUserDot;
use etwin_core::dinoparc::{DinoparcServer, DinoparcStore, DinoparcUserIdRef, ShortDinoparcUser};
use etwin_core::hammerfest::{
  HammerfestServer, HammerfestStore, HammerfestUserIdRef, HammerfestUsername, ShortHammerfestUser,
};
use etwin_core::link::{
  GetLinkOptions, GetLinksFromEtwinOptions, LinkStore, RawLink, TouchLinkOptions, VersionedRawLink, VersionedRawLinks,
};
use etwin_core::user::{CreateUserOptions, UserDisplayName, UserIdRef, UserStore, Username};
use std::str::FromStr;

pub(crate) struct TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyLinkStore, TyUserStore>
where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
{
  pub(crate) clock: TyClock,
  pub(crate) dinoparc_store: TyDinoparcStore,
  pub(crate) hammerfest_store: TyHammerfestStore,
  pub(crate) link_store: TyLinkStore,
  pub(crate) user_store: TyUserStore,
}

pub(crate) async fn test_empty<TyClock, TyDinoparcStore, TyHammerfestStore, TyLinkStore, TyUserStore>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyLinkStore, TyUserStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
{
  api
    .hammerfest_store
    .touch_short_user(&ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: HammerfestUsername::from_str("alice").unwrap(),
    })
    .await
    .unwrap();

  let actual = api
    .link_store
    .get_link_from_hammerfest(&GetLinkOptions {
      remote: HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "123".parse().unwrap(),
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

pub(crate) async fn test_empty_etwin<TyClock, TyDinoparcStore, TyHammerfestStore, TyLinkStore, TyUserStore>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyLinkStore, TyUserStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
{
  let user = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: UserDisplayName::from_str("Alice").unwrap(),
      username: Some(Username::from_str("alice").unwrap()),
      email: None,
    })
    .await
    .unwrap();

  let actual = api
    .link_store
    .get_links_from_etwin(&GetLinksFromEtwinOptions {
      etwin: UserIdRef { id: user.id },
      time: None,
    })
    .await
    .unwrap();
  let expected: VersionedRawLinks = VersionedRawLinks::default();
  assert_eq!(actual, expected);
}

pub(crate) async fn test_etwin_linked_to_dinoparc_com<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyLinkStore,
  TyUserStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyLinkStore, TyUserStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));

  let user = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: UserDisplayName::from_str("Alice").unwrap(),
      username: Some(Username::from_str("alice").unwrap()),
      email: None,
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .dinoparc_store
    .touch_short_user(&ShortDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .link_store
    .touch_dinoparc_link(&TouchLinkOptions {
      etwin: UserIdRef { id: user.id },
      remote: DinoparcUserIdRef {
        server: DinoparcServer::DinoparcCom,
        id: "123".parse().unwrap(),
      },
      linked_by: UserIdRef { id: user.id },
    })
    .await
    .unwrap();

  let actual = api
    .link_store
    .get_links_from_etwin(&GetLinksFromEtwinOptions {
      etwin: UserIdRef { id: user.id },
      time: None,
    })
    .await
    .unwrap();
  let expected: VersionedRawLinks = {
    let mut links = VersionedRawLinks::default();
    links.dinoparc_com.current = Some(RawLink {
      link: RawUserDot {
        user: UserIdRef { id: user.id },
        time: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
      },
      unlink: (),
      etwin: UserIdRef { id: user.id },
      remote: DinoparcUserIdRef {
        server: DinoparcServer::DinoparcCom,
        id: "123".parse().unwrap(),
      },
    });
    links
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_etwin_linked_to_hammerfest_fr<
  TyClock,
  TyDinoparcStore,
  TyHammerfestStore,
  TyLinkStore,
  TyUserStore,
>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyLinkStore, TyUserStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));

  let user = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: UserDisplayName::from_str("Alice").unwrap(),
      username: Some(Username::from_str("alice").unwrap()),
      email: None,
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .hammerfest_store
    .touch_short_user(&ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "234".parse().unwrap(),
      username: "alicehf".parse().unwrap(),
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .link_store
    .touch_hammerfest_link(&TouchLinkOptions {
      etwin: UserIdRef { id: user.id },
      remote: HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "234".parse().unwrap(),
      },
      linked_by: UserIdRef { id: user.id },
    })
    .await
    .unwrap();

  let actual = api
    .link_store
    .get_links_from_etwin(&GetLinksFromEtwinOptions {
      etwin: UserIdRef { id: user.id },
      time: None,
    })
    .await
    .unwrap();
  let expected: VersionedRawLinks = {
    let mut links = VersionedRawLinks::default();
    links.hammerfest_fr.current = Some(RawLink {
      link: RawUserDot {
        user: UserIdRef { id: user.id },
        time: Utc.ymd(2021, 1, 1).and_hms(0, 0, 2),
      },
      unlink: (),
      etwin: UserIdRef { id: user.id },
      remote: HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "234".parse().unwrap(),
      },
    });
    links
  };
  assert_eq!(actual, expected);
}
