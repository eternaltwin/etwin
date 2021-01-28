use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::core::RawUserDot;
use etwin_core::dinoparc::{DinoparcServer, DinoparcUserId, DinoparcUserIdRef};
use etwin_core::hammerfest::{HammerfestServer, HammerfestUserId, HammerfestUserIdRef};
use etwin_core::link::{
  GetLinkOptions, GetLinksFromEtwinOptions, LinkStore, RawLink, RemoteUserIdRef, TouchLinkError, TouchLinkOptions,
  VersionedRawLink, VersionedRawLinks,
};
use etwin_core::twinoid::{TwinoidUserId, TwinoidUserIdRef};
use etwin_core::user::UserId;
use std::collections::HashMap;
use std::error::Error;
use std::sync::RwLock;

struct StoreState {
  from_dinoparc: HashMap<(DinoparcServer, DinoparcUserId), RawLink<DinoparcUserIdRef>>,
  to_dinoparc: HashMap<(UserId, DinoparcServer), RawLink<DinoparcUserIdRef>>,
  from_hammerfest: HashMap<(HammerfestServer, HammerfestUserId), RawLink<HammerfestUserIdRef>>,
  to_hammerfest: HashMap<(UserId, HammerfestServer), RawLink<HammerfestUserIdRef>>,
  from_twinoid: HashMap<TwinoidUserId, RawLink<TwinoidUserIdRef>>,
  to_twinoid: HashMap<UserId, RawLink<TwinoidUserIdRef>>,
}

impl StoreState {
  fn new() -> Self {
    Self {
      from_dinoparc: HashMap::new(),
      to_dinoparc: HashMap::new(),
      from_hammerfest: HashMap::new(),
      to_hammerfest: HashMap::new(),
      from_twinoid: HashMap::new(),
      to_twinoid: HashMap::new(),
    }
  }
}

pub struct MemLinkStore<TyClock: Clock> {
  clock: TyClock,
  state: RwLock<StoreState>,
}

impl<TyClock> MemLinkStore<TyClock>
where
  TyClock: Clock,
{
  pub fn new(clock: TyClock) -> Self {
    Self {
      clock,
      state: RwLock::new(StoreState::new()),
    }
  }
}

#[async_trait]
impl<TyClock> LinkStore for MemLinkStore<TyClock>
where
  TyClock: Clock,
{
  async fn touch_dinoparc_link(
    &self,
    options: &TouchLinkOptions<DinoparcUserIdRef>,
  ) -> Result<VersionedRawLink<DinoparcUserIdRef>, TouchLinkError<DinoparcUserIdRef>> {
    let mut state = self.state.write().unwrap();
    let state: &mut StoreState = &mut state;
    touch_link(
      &mut state.from_dinoparc,
      &mut state.to_dinoparc,
      (options.remote.server, options.remote.id),
      (options.etwin.id, options.remote.server),
      || {
        let now = self.clock.now();
        let link: RawLink<DinoparcUserIdRef> = RawLink {
          link: RawUserDot {
            time: now,
            user: options.linked_by,
          },
          unlink: (),
          etwin: options.etwin,
          remote: options.remote.clone(),
        };
        link
      },
    )
  }

  async fn touch_hammerfest_link(
    &self,
    options: &TouchLinkOptions<HammerfestUserIdRef>,
  ) -> Result<VersionedRawLink<HammerfestUserIdRef>, TouchLinkError<HammerfestUserIdRef>> {
    let mut state = self.state.write().unwrap();
    let state: &mut StoreState = &mut state;
    touch_link(
      &mut state.from_hammerfest,
      &mut state.to_hammerfest,
      (options.remote.server, options.remote.id),
      (options.etwin.id, options.remote.server),
      || {
        let now = self.clock.now();
        let link: RawLink<HammerfestUserIdRef> = RawLink {
          link: RawUserDot {
            time: now,
            user: options.linked_by,
          },
          unlink: (),
          etwin: options.etwin,
          remote: options.remote.clone(),
        };
        link
      },
    )
  }

  async fn touch_twinoid_link(
    &self,
    options: &TouchLinkOptions<TwinoidUserIdRef>,
  ) -> Result<VersionedRawLink<TwinoidUserIdRef>, TouchLinkError<TwinoidUserIdRef>> {
    let mut state = self.state.write().unwrap();
    let state: &mut StoreState = &mut state;
    touch_link(
      &mut state.from_twinoid,
      &mut state.to_twinoid,
      options.remote.id,
      options.etwin.id,
      || {
        let now = self.clock.now();
        let link: RawLink<TwinoidUserIdRef> = RawLink {
          link: RawUserDot {
            time: now,
            user: options.linked_by,
          },
          unlink: (),
          etwin: options.etwin,
          remote: options.remote.clone(),
        };
        link
      },
    )
  }

  async fn get_link_from_dinoparc(
    &self,
    options: &GetLinkOptions<DinoparcUserIdRef>,
  ) -> Result<VersionedRawLink<DinoparcUserIdRef>, Box<dyn Error>> {
    // assert!(options.time.is_none());
    let state = self.state.read().unwrap();
    let link = state.from_dinoparc.get(&(options.remote.server, options.remote.id));

    match link {
      None => Ok(VersionedRawLink {
        current: None,
        old: vec![],
      }),
      Some(link) => {
        let link: VersionedRawLink<DinoparcUserIdRef> = VersionedRawLink {
          current: Some(link.clone()),
          old: vec![],
        };
        Ok(link)
      }
    }
  }

  async fn get_link_from_hammerfest(
    &self,
    options: &GetLinkOptions<HammerfestUserIdRef>,
  ) -> Result<VersionedRawLink<HammerfestUserIdRef>, Box<dyn Error>> {
    // assert!(options.time.is_none());
    let state = self.state.read().unwrap();
    let link = state.from_hammerfest.get(&(options.remote.server, options.remote.id));

    match link {
      None => Ok(VersionedRawLink {
        current: None,
        old: vec![],
      }),
      Some(link) => {
        let link: VersionedRawLink<HammerfestUserIdRef> = VersionedRawLink {
          current: Some(link.clone()),
          old: vec![],
        };
        Ok(link)
      }
    }
  }

  async fn get_link_from_twinoid(
    &self,
    options: &GetLinkOptions<TwinoidUserIdRef>,
  ) -> Result<VersionedRawLink<TwinoidUserIdRef>, Box<dyn Error>> {
    // assert!(options.time.is_none());
    let state = self.state.read().unwrap();
    let link = state.from_twinoid.get(&options.remote.id);

    match link {
      None => Ok(VersionedRawLink {
        current: None,
        old: vec![],
      }),
      Some(link) => {
        let link: VersionedRawLink<TwinoidUserIdRef> = VersionedRawLink {
          current: Some(link.clone()),
          old: vec![],
        };
        Ok(link)
      }
    }
  }

  async fn get_links_from_etwin(
    &self,
    options: &GetLinksFromEtwinOptions,
  ) -> Result<VersionedRawLinks, Box<dyn Error>> {
    let state = self.state.read().unwrap();
    let mut links = VersionedRawLinks::default();

    for srv in DinoparcServer::iter() {
      if let Some(link) = state.to_dinoparc.get(&(options.etwin.id, srv)) {
        let link = link.clone();
        match link.remote.server {
          DinoparcServer::DinoparcCom => links.dinoparc_com.current = Some(link),
          DinoparcServer::EnDinoparcCom => links.en_dinoparc_com.current = Some(link),
          DinoparcServer::SpDinoparcCom => links.sp_dinoparc_com.current = Some(link),
        }
      }
    }

    for srv in HammerfestServer::iter() {
      if let Some(link) = state.to_hammerfest.get(&(options.etwin.id, srv)) {
        let link = link.clone();
        match link.remote.server {
          HammerfestServer::HammerfestEs => links.hammerfest_es.current = Some(link),
          HammerfestServer::HammerfestFr => links.hammerfest_fr.current = Some(link),
          HammerfestServer::HfestNet => links.hfest_net.current = Some(link),
        }
      }
    }

    {
      if let Some(link) = state.to_twinoid.get(&options.etwin.id) {
        links.twinoid.current = Some(link.clone());
      }
    }

    Ok(links)
  }
}

#[cfg(feature = "neon")]
impl<TyClock> neon::prelude::Finalize for MemLinkStore<TyClock> where TyClock: Clock {}

fn touch_link<FK: Eq + core::hash::Hash, TK: Eq + core::hash::Hash, R: RemoteUserIdRef>(
  from: &mut HashMap<FK, RawLink<R>>,
  to: &mut HashMap<TK, RawLink<R>>,
  from_key: FK,
  to_key: TK,
  link: impl FnOnce() -> RawLink<R>,
) -> Result<VersionedRawLink<R>, TouchLinkError<R>> {
  let linked_etwin = from.get(&from_key);
  let linked_remote = to.get(&to_key);

  match (linked_etwin, linked_remote) {
    (None, None) => {
      let link: RawLink<R> = link();
      from.insert(from_key, link.clone());
      to.insert(to_key, link.clone());
      let link: VersionedRawLink<R> = VersionedRawLink {
        current: Some(link),
        old: vec![],
      };
      Ok(link)
    }
    (Some(linked_etwin), None) => Err(TouchLinkError::ConflictEtwin(linked_etwin.etwin)),
    (None, Some(linked_remote)) => Err(TouchLinkError::ConflictRemote(linked_remote.remote.clone())),
    (Some(linked_etwin), Some(linked_remote)) => Err(TouchLinkError::ConflictBoth(
      linked_etwin.etwin,
      linked_remote.remote.clone(),
    )),
  }
}

#[cfg(test)]
mod test {
  use crate::mem::MemLinkStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::dinoparc::DinoparcStore;
  use etwin_core::hammerfest::HammerfestStore;
  use etwin_core::link::LinkStore;
  use etwin_core::user::UserStore;
  use etwin_core::uuid::Uuid4Generator;
  use etwin_dinoparc_store::mem::MemDinoparcStore;
  use etwin_hammerfest_store::mem::MemHammerfestStore;
  use etwin_user_store::mem::MemUserStore;
  use std::sync::Arc;

  #[allow(clippy::type_complexity)]
  fn make_test_api() -> TestApi<
    Arc<VirtualClock>,
    Arc<dyn DinoparcStore>,
    Arc<dyn HammerfestStore>,
    Arc<dyn LinkStore>,
    Arc<dyn UserStore>,
  > {
    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let dinoparc_store: Arc<dyn DinoparcStore> = Arc::new(MemDinoparcStore::new(Arc::clone(&clock)));
    let hammerfest_store: Arc<dyn HammerfestStore> = Arc::new(MemHammerfestStore::new(Arc::clone(&clock)));
    let link_store: Arc<dyn LinkStore> = Arc::new(MemLinkStore::new(Arc::clone(&clock)));
    let user_store: Arc<dyn UserStore> = Arc::new(MemUserStore::new(Arc::clone(&clock), Uuid4Generator));

    TestApi {
      clock,
      dinoparc_store,
      hammerfest_store,
      link_store,
      user_store,
    }
  }

  #[tokio::test]
  async fn test_empty() {
    crate::test::test_empty(make_test_api()).await;
  }

  #[tokio::test]
  async fn test_empty_etwin() {
    crate::test::test_empty_etwin(make_test_api()).await;
  }

  #[tokio::test]
  async fn test_etwin_linked_to_dinoparc_com() {
    crate::test::test_etwin_linked_to_dinoparc_com(make_test_api()).await;
  }

  #[tokio::test]
  async fn test_etwin_linked_to_hammerfest_fr() {
    crate::test::test_etwin_linked_to_hammerfest_fr(make_test_api()).await;
  }
}
