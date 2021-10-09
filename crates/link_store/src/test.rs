use chrono::Duration;
use etwin_core::api::ApiRef;
use etwin_core::clock::VirtualClock;
use etwin_core::core::{Instant, RawUserDot};
use etwin_core::dinoparc::{DinoparcServer, DinoparcStore, DinoparcUserIdRef, ShortDinoparcUser};
use etwin_core::hammerfest::{HammerfestServer, HammerfestStore, HammerfestUserIdRef, ShortHammerfestUser};
use etwin_core::link::{
  DeleteLinkOptions, GetLinkOptions, GetLinksFromEtwinOptions, LinkStore, RawLink, TouchLinkOptions, VersionedRawLink,
  VersionedRawLinks,
};
use etwin_core::user::{CreateUserOptions, UserIdRef, UserStore};

#[macro_export]
macro_rules! test_link_store {
  ($(#[$meta:meta])* || $api:expr) => {
    register_test!($(#[$meta])*, $api, test_empty);
    register_test!($(#[$meta])*, $api, test_empty_etwin);
    register_test!($(#[$meta])*, $api, test_etwin_linked_to_dinoparc_com);
    register_test!($(#[$meta])*, $api, test_etwin_linked_to_hammerfest_fr);
    register_test!($(#[$meta])*, $api, test_unlink_hammerfest);
    register_test!($(#[$meta])*, $api, test_swap_hammerfest);
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
      username: "alice".parse().unwrap(),
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
      display_name: "Alice".parse().unwrap(),
      username: Some("alice".parse().unwrap()),
      email: None,
      password: None,
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
  api.clock.as_ref().advance_to(Instant::ymd_hms(2021, 1, 1, 0, 0, 0));

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
        time: Instant::ymd_hms(2021, 1, 1, 0, 0, 2),
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
  api.clock.as_ref().advance_to(Instant::ymd_hms(2021, 1, 1, 0, 0, 0));

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
        time: Instant::ymd_hms(2021, 1, 1, 0, 0, 2),
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

pub(crate) async fn test_unlink_hammerfest<TyClock, TyDinoparcStore, TyHammerfestStore, TyLinkStore, TyUserStore>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyLinkStore, TyUserStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Instant::ymd_hms(2021, 1, 1, 0, 0, 0));

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

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .link_store
    .delete_hammerfest_link(&DeleteLinkOptions {
      etwin: UserIdRef { id: user.id },
      remote: HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "234".parse().unwrap(),
      },
      unlinked_by: user.id.into(),
    })
    .await
    .unwrap();

  let actual = api
    .link_store
    .get_links_from_etwin(&GetLinksFromEtwinOptions {
      etwin: user.id.into(),
      time: None,
    })
    .await
    .unwrap();

  let expected: VersionedRawLinks = {
    let mut links = VersionedRawLinks::default();
    links.hammerfest_fr.current = None;
    links
  };
  assert_eq!(actual, expected);
}

pub(crate) async fn test_swap_hammerfest<TyClock, TyDinoparcStore, TyHammerfestStore, TyLinkStore, TyUserStore>(
  api: TestApi<TyClock, TyDinoparcStore, TyHammerfestStore, TyLinkStore, TyUserStore>,
) where
  TyClock: ApiRef<VirtualClock>,
  TyDinoparcStore: DinoparcStore,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
{
  api.clock.as_ref().advance_to(Instant::ymd_hms(2021, 1, 1, 0, 0, 0));

  let alice = api
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

  let bob = api
    .user_store
    .create_user(&CreateUserOptions {
      display_name: "Bob".parse().unwrap(),
      username: Some("bob".parse().unwrap()),
      email: None,
      password: None,
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
    .hammerfest_store
    .touch_short_user(&ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "345".parse().unwrap(),
      username: "bobhf".parse().unwrap(),
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .link_store
    .touch_hammerfest_link(&TouchLinkOptions {
      etwin: alice.id.into(),
      remote: HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "234".parse().unwrap(),
      },
      linked_by: alice.id.into(),
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .link_store
    .touch_hammerfest_link(&TouchLinkOptions {
      etwin: bob.id.into(),
      remote: HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "345".parse().unwrap(),
      },
      linked_by: bob.id.into(),
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .link_store
    .delete_hammerfest_link(&DeleteLinkOptions {
      etwin: alice.id.into(),
      remote: HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "234".parse().unwrap(),
      },
      unlinked_by: alice.id.into(),
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .link_store
    .delete_hammerfest_link(&DeleteLinkOptions {
      etwin: bob.id.into(),
      remote: HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "345".parse().unwrap(),
      },
      unlinked_by: bob.id.into(),
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .link_store
    .touch_hammerfest_link(&TouchLinkOptions {
      etwin: alice.id.into(),
      remote: HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "345".parse().unwrap(),
      },
      linked_by: alice.id.into(),
    })
    .await
    .unwrap();

  api.clock.as_ref().advance_by(Duration::seconds(1));

  api
    .link_store
    .touch_hammerfest_link(&TouchLinkOptions {
      etwin: bob.id.into(),
      remote: HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "234".parse().unwrap(),
      },
      linked_by: bob.id.into(),
    })
    .await
    .unwrap();

  let actual = api
    .link_store
    .get_links_from_etwin(&GetLinksFromEtwinOptions {
      etwin: alice.id.into(),
      time: None,
    })
    .await
    .unwrap();

  let expected: VersionedRawLinks = {
    let mut links = VersionedRawLinks::default();
    links.hammerfest_fr.current = Some(RawLink {
      link: RawUserDot {
        user: alice.id.into(),
        time: Instant::ymd_hms(2021, 1, 1, 0, 0, 8),
      },
      unlink: (),
      etwin: alice.id.into(),
      remote: HammerfestUserIdRef {
        server: HammerfestServer::HammerfestFr,
        id: "345".parse().unwrap(),
      },
    });
    links
  };
  assert_eq!(actual, expected);
}
