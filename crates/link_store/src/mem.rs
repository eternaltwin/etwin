use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::core::RawUserDot;
use etwin_core::dinoparc::{DinoparcServer, DinoparcUserId, DinoparcUserIdRef};
use etwin_core::hammerfest::{HammerfestServer, HammerfestUserId, HammerfestUserIdRef};
use etwin_core::link::{
  DeleteLinkError, DeleteLinkOptions, GetLinkOptions, GetLinksFromEtwinOptions, LinkStore, OldRawLink, RawLink,
  RemoteUserIdRef, TouchLinkError, TouchLinkOptions, VersionedRawLink, VersionedRawLinks,
};
use etwin_core::twinoid::{TwinoidUserId, TwinoidUserIdRef};
use etwin_core::user::UserId;
use std::collections::HashMap;
use std::error::Error;
use std::sync::RwLock;

struct RawLinkHistory<T: RemoteUserIdRef> {
  current: Option<RawLink<T>>,
  old: Vec<OldRawLink<T>>,
}

impl<T: RemoteUserIdRef> Default for RawLinkHistory<T> {
  fn default() -> Self {
    Self {
      current: None,
      old: vec![],
    }
  }
}

struct StoreState {
  from_dinoparc: HashMap<(DinoparcServer, DinoparcUserId), RawLinkHistory<DinoparcUserIdRef>>,
  to_dinoparc: HashMap<(UserId, DinoparcServer), RawLinkHistory<DinoparcUserIdRef>>,
  from_hammerfest: HashMap<(HammerfestServer, HammerfestUserId), RawLinkHistory<HammerfestUserIdRef>>,
  to_hammerfest: HashMap<(UserId, HammerfestServer), RawLinkHistory<HammerfestUserIdRef>>,
  from_twinoid: HashMap<TwinoidUserId, RawLinkHistory<TwinoidUserIdRef>>,
  to_twinoid: HashMap<UserId, RawLinkHistory<TwinoidUserIdRef>>,
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
          remote: options.remote,
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
          remote: options.remote,
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
          remote: options.remote,
        };
        link
      },
    )
  }

  async fn delete_dinoparc_link(
    &self,
    options: &DeleteLinkOptions<DinoparcUserIdRef>,
  ) -> Result<VersionedRawLink<DinoparcUserIdRef>, DeleteLinkError<DinoparcUserIdRef>> {
    let mut state = self.state.write().unwrap();
    let state: &mut StoreState = &mut state;
    delete_link(
      &mut state.from_dinoparc,
      &mut state.to_dinoparc,
      (options.remote.server, options.remote.id),
      (options.etwin.id, options.remote.server),
      |start| {
        let now = self.clock.now();
        let link: OldRawLink<DinoparcUserIdRef> = OldRawLink {
          link: start.link,
          unlink: RawUserDot {
            time: now,
            user: options.unlinked_by,
          },
          etwin: options.etwin,
          remote: options.remote,
        };
        link
      },
      || DeleteLinkError::NotFound(options.etwin, options.remote),
    )
    .map(|_| Default::default())
  }

  async fn delete_hammerfest_link(
    &self,
    options: &DeleteLinkOptions<HammerfestUserIdRef>,
  ) -> Result<VersionedRawLink<HammerfestUserIdRef>, DeleteLinkError<HammerfestUserIdRef>> {
    let mut state = self.state.write().unwrap();
    let state: &mut StoreState = &mut state;
    delete_link(
      &mut state.from_hammerfest,
      &mut state.to_hammerfest,
      (options.remote.server, options.remote.id),
      (options.etwin.id, options.remote.server),
      |start| {
        let now = self.clock.now();
        let link: OldRawLink<HammerfestUserIdRef> = OldRawLink {
          link: start.link,
          unlink: RawUserDot {
            time: now,
            user: options.unlinked_by,
          },
          etwin: options.etwin,
          remote: options.remote,
        };
        link
      },
      || DeleteLinkError::NotFound(options.etwin, options.remote),
    )
    .map(|_| Default::default())
  }

  async fn delete_twinoid_link(
    &self,
    options: &DeleteLinkOptions<TwinoidUserIdRef>,
  ) -> Result<VersionedRawLink<TwinoidUserIdRef>, DeleteLinkError<TwinoidUserIdRef>> {
    let mut state = self.state.write().unwrap();
    let state: &mut StoreState = &mut state;
    delete_link(
      &mut state.from_twinoid,
      &mut state.to_twinoid,
      options.remote.id,
      options.etwin.id,
      |start| {
        let now = self.clock.now();
        let link: OldRawLink<TwinoidUserIdRef> = OldRawLink {
          link: start.link,
          unlink: RawUserDot {
            time: now,
            user: options.unlinked_by,
          },
          etwin: options.etwin,
          remote: options.remote,
        };
        link
      },
      || DeleteLinkError::NotFound(options.etwin, options.remote),
    )
    .map(|_| Default::default())
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
          current: link.current.clone(),
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
          current: link.current.clone(),
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
          current: link.current.clone(),
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
      let empty = RawLinkHistory::<DinoparcUserIdRef>::default();
      let link = state.to_dinoparc.get(&(options.etwin.id, srv)).unwrap_or(&empty);
      match srv {
        DinoparcServer::DinoparcCom => links.dinoparc_com.current = link.current.clone(),
        DinoparcServer::EnDinoparcCom => links.en_dinoparc_com.current = link.current.clone(),
        DinoparcServer::SpDinoparcCom => links.sp_dinoparc_com.current = link.current.clone(),
      }
    }

    for srv in HammerfestServer::iter() {
      let empty = RawLinkHistory::<HammerfestUserIdRef>::default();
      let link = state.to_hammerfest.get(&(options.etwin.id, srv)).unwrap_or(&empty);
      match srv {
        HammerfestServer::HammerfestEs => links.hammerfest_es.current = link.current.clone(),
        HammerfestServer::HammerfestFr => links.hammerfest_fr.current = link.current.clone(),
        HammerfestServer::HfestNet => links.hfest_net.current = link.current.clone(),
      }
    }

    {
      let empty = RawLinkHistory::<TwinoidUserIdRef>::default();
      let link = state.to_twinoid.get(&options.etwin.id).unwrap_or(&empty);
      links.twinoid.current = link.current.clone();
    }

    Ok(links)
  }
}

#[cfg(feature = "neon")]
impl<TyClock> neon::prelude::Finalize for MemLinkStore<TyClock> where TyClock: Clock {}

fn touch_link<FK: Eq + core::hash::Hash, TK: Eq + core::hash::Hash, R: RemoteUserIdRef>(
  from: &mut HashMap<FK, RawLinkHistory<R>>,
  to: &mut HashMap<TK, RawLinkHistory<R>>,
  from_key: FK,
  to_key: TK,
  link: impl FnOnce() -> RawLink<R>,
) -> Result<VersionedRawLink<R>, TouchLinkError<R>> {
  let linked_etwin = from.entry(from_key).or_default();
  let linked_remote = to.entry(to_key).or_default();

  match (&mut linked_etwin.current, &mut linked_remote.current) {
    (from @ None, to @ None) => {
      let link: RawLink<R> = link();
      *from = Some(link.clone());
      *to = Some(link.clone());
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

fn delete_link<FK: Eq + core::hash::Hash, TK: Eq + core::hash::Hash, R: RemoteUserIdRef>(
  from: &mut HashMap<FK, RawLinkHistory<R>>,
  to: &mut HashMap<TK, RawLinkHistory<R>>,
  from_key: FK,
  to_key: TK,
  old_link: impl FnOnce(RawLink<R>) -> OldRawLink<R>,
  not_found_err: impl FnOnce() -> DeleteLinkError<R>,
) -> Result<(), DeleteLinkError<R>> {
  let linked_etwin = from.get_mut(&from_key);
  let linked_remote = to.get_mut(&to_key);
  let (linked_etwin, linked_remote) = match (linked_etwin, linked_remote) {
    (Some(linked_etwin), Some(linked_remote)) => (linked_etwin, linked_remote),
    _ => return Err(not_found_err()),
  };

  match (&mut linked_etwin.current, &mut linked_remote.current) {
    (from @ Some(_), to @ Some(_)) if from == to => {
      let link = old_link(from.take().unwrap());
      *to = None;
      linked_etwin.old.push(link.clone());
      linked_remote.old.push(link);
      Ok(())
    }
    _ => Err(not_found_err()),
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

  test_link_store!(|| make_test_api());
}
