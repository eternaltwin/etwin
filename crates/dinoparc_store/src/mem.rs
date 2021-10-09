use async_trait::async_trait;
use etwin_constants::dinoparc::MAX_SIDEBAR_DINOZ_COUNT;
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, IntPercentage};
use etwin_core::dinoparc::{
  ArchivedDinoparcDinoz, ArchivedDinoparcUser, DinoparcCollection, DinoparcCollectionResponse, DinoparcDinozElements,
  DinoparcDinozId, DinoparcDinozIdRef, DinoparcDinozName, DinoparcDinozRace, DinoparcDinozResponse, DinoparcDinozSkin,
  DinoparcExchangeWithResponse, DinoparcInventoryResponse, DinoparcItemId, DinoparcLocationId, DinoparcServer,
  DinoparcSessionUser, DinoparcSkill, DinoparcSkillLevel, DinoparcStore, DinoparcUserId, DinoparcUserIdRef,
  DinoparcUsername, GetDinoparcDinozOptions, GetDinoparcUserOptions, ShortDinoparcDinozWithLevel, ShortDinoparcUser,
};
use etwin_core::temporal::{CheckedSnapshotLog, LatestTemporal, SnapshotLog};
use etwin_core::types::AnyError;
use std::collections::HashMap;
use std::sync::RwLock;

struct StoreState {
  users: HashMap<DinoparcUserIdRef, StoreUser>,
  dinoz: HashMap<DinoparcDinozIdRef, StoreDinoz>,
}

struct StoreUser {
  server: DinoparcServer,
  id: DinoparcUserId,
  archived_at: Instant,
  username: DinoparcUsername,
  coins: SnapshotLog<u32>,
  bills: SnapshotLog<u32>,
  dinoz: CheckedSnapshotLog<Vec<DinoparcDinozId>>,
  inventory: SnapshotLog<HashMap<DinoparcItemId, u32>>,
  collection: SnapshotLog<DinoparcCollection>,
}

struct StoreDinoz {
  server: DinoparcServer,
  id: DinoparcDinozId,
  archived_at: Instant,
  name: SnapshotLog<Option<DinoparcDinozName>>,
  owner: SnapshotLog<DinoparcUserId>,
  location: SnapshotLog<DinoparcLocationId>,
  race: SnapshotLog<DinoparcDinozRace>,
  skin: SnapshotLog<DinoparcDinozSkin>,
  life: SnapshotLog<IntPercentage>,
  level: SnapshotLog<u16>,
  experience: SnapshotLog<IntPercentage>,
  danger: SnapshotLog<i16>,
  in_tournament: SnapshotLog<bool>,
  elements: SnapshotLog<DinoparcDinozElements>,
  skills: SnapshotLog<HashMap<DinoparcSkill, DinoparcSkillLevel>>,
}

impl<'a> From<&'a StoreUser> for ArchivedDinoparcUser {
  fn from(user: &'a StoreUser) -> Self {
    Self {
      server: user.server,
      id: user.id,
      archived_at: user.archived_at,
      username: user.username.clone(),
      coins: user
        .coins
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
      dinoz: user.dinoz.latest().map(|latest| LatestTemporal {
        latest: latest.map(|dinoz| {
          dinoz
            .iter()
            .map(|id| DinoparcDinozIdRef {
              server: user.server,
              id: *id,
            })
            .collect()
        }),
      }),
      inventory: user
        .inventory
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
      collection: user
        .collection
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
    }
  }
}

impl StoreState {
  fn new() -> Self {
    Self {
      users: HashMap::new(),
      dinoz: HashMap::new(),
    }
  }

  fn get_user(&self, id: &DinoparcUserIdRef) -> Option<&StoreUser> {
    self.users.get(id)
  }

  fn get_dinoz(&self, id: &DinoparcDinozIdRef) -> Option<&StoreDinoz> {
    self.dinoz.get(id)
  }

  fn to_archived_dinoz(&self, dinoz: &StoreDinoz) -> ArchivedDinoparcDinoz {
    ArchivedDinoparcDinoz {
      server: dinoz.server,
      id: dinoz.id,
      archived_at: dinoz.archived_at,
      name: dinoz
        .name
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
      owner: dinoz.owner.latest().map(|latest| LatestTemporal {
        latest: latest.map(|owner| {
          let owner = self
            .users
            .get(&owner.and_server(dinoz.server))
            .expect("OwnerMustBeStored");
          ShortDinoparcUser {
            server: owner.server,
            id: owner.id,
            username: owner.username.clone(),
          }
        }),
      }),
      location: dinoz
        .location
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
      race: dinoz
        .race
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
      skin: dinoz
        .skin
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
      life: dinoz
        .life
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
      level: dinoz
        .level
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
      experience: dinoz
        .experience
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
      danger: dinoz
        .danger
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
      in_tournament: dinoz
        .in_tournament
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
      elements: dinoz
        .elements
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
      skills: dinoz
        .skills
        .latest()
        .map(|l| l.cloned())
        .map(|latest| LatestTemporal { latest }),
    }
  }

  fn touch_user(&mut self, time: Instant, user: ShortDinoparcUser) -> &mut StoreUser {
    self.users.entry(user.as_ref()).or_insert_with(|| StoreUser {
      server: user.server,
      id: user.id,
      archived_at: time,
      username: user.username,
      coins: SnapshotLog::new(),
      bills: SnapshotLog::new(),
      dinoz: CheckedSnapshotLog::new(),
      inventory: SnapshotLog::new(),
      collection: SnapshotLog::new(),
    })
  }

  fn touch_dinoz(&mut self, time: Instant, dinoz: DinoparcDinozIdRef) -> &mut StoreDinoz {
    self.dinoz.entry(dinoz).or_insert_with(|| StoreDinoz {
      server: dinoz.server,
      id: dinoz.id,
      archived_at: time,
      name: SnapshotLog::new(),
      owner: SnapshotLog::new(),
      location: SnapshotLog::new(),
      race: SnapshotLog::new(),
      skin: SnapshotLog::new(),
      life: SnapshotLog::new(),
      level: SnapshotLog::new(),
      experience: SnapshotLog::new(),
      danger: SnapshotLog::new(),
      in_tournament: SnapshotLog::new(),
      elements: SnapshotLog::new(),
      skills: SnapshotLog::new(),
    })
  }

  fn touch_session_user(&mut self, time: Instant, session_user: &DinoparcSessionUser) -> &mut StoreUser {
    self.touch_user(time, session_user.user.clone());
    let mut user_dinoz = Vec::new();
    for dinoz in session_user.dinoz.iter() {
      user_dinoz.push(dinoz.id);
      let d = self.touch_dinoz(time, dinoz.as_ref());
      d.owner.snapshot(time, session_user.user.id);
      d.name.snapshot(time, dinoz.name.clone());
      if let Some(location) = dinoz.location {
        d.location.snapshot(time, location);
      }
    }
    let user = self
      .users
      .get_mut(&session_user.user.as_ref())
      .expect("ExpectedUserToBeStored");
    user.coins.snapshot(time, session_user.coins);
    if user_dinoz.len() < usize::from(MAX_SIDEBAR_DINOZ_COUNT) {
      user.dinoz.snapshot(time, user_dinoz);
    }
    user
  }

  fn touch_inventory(&mut self, time: Instant, response: &DinoparcInventoryResponse) {
    let user = self.touch_session_user(time, &response.session_user);
    user.inventory.snapshot(time, response.inventory.clone());
  }

  fn touch_collection(&mut self, time: Instant, response: &DinoparcCollectionResponse) {
    let user = self.touch_session_user(time, &response.session_user);
    user.collection.snapshot(time, response.collection.clone());
  }

  fn touch_dinoz_profile(&mut self, time: Instant, response: &DinoparcDinozResponse) {
    self.touch_session_user(time, &response.session_user);
    let dinoz = self.touch_dinoz(time, response.dinoz.as_ref());
    dinoz.name.snapshot(time, response.dinoz.name().cloned());
    dinoz.owner.snapshot(time, response.session_user.user.id);
    dinoz.level.snapshot(time, response.dinoz.level);
    dinoz.race.snapshot(time, response.dinoz.race);
    dinoz.skin.snapshot(time, response.dinoz.skin.clone());
    if let Some(fields) = response.dinoz.named.as_ref() {
      dinoz.location.snapshot(time, fields.location);
      dinoz.life.snapshot(time, fields.life);
      dinoz.experience.snapshot(time, fields.experience);
      dinoz.danger.snapshot(time, fields.danger);
      dinoz.in_tournament.snapshot(time, fields.in_tournament);
      dinoz.elements.snapshot(time, fields.elements);
      dinoz.skills.snapshot(time, fields.skills.clone());
    }
  }

  fn touch_exchange_with(&mut self, time: Instant, response: &DinoparcExchangeWithResponse) {
    let user = self.touch_session_user(time, &response.session_user);
    user.bills.snapshot(time, response.own_bills);
    self.touch_user(time, response.other_user.clone());
    self.touch_exchange_dinoz(time, response.session_user.user.as_ref(), &response.own_dinoz);
    self.touch_exchange_dinoz(time, response.other_user.as_ref(), &response.other_dinoz);
  }

  fn touch_exchange_dinoz(&mut self, time: Instant, owner: DinoparcUserIdRef, list: &[ShortDinoparcDinozWithLevel]) {
    let mut user_dinoz = Vec::new();
    for dinoz in list.iter() {
      user_dinoz.push(dinoz.id);
      let d = self.touch_dinoz(time, dinoz.as_ref());
      d.owner.snapshot(time, owner.id);
      d.name.snapshot(time, dinoz.name.clone());
      d.level.snapshot(time, dinoz.level);
    }
    let owner = self.users.get_mut(&owner).expect("OwnerShouldAlreadyBeStored");
    owner.dinoz.snapshot(time, user_dinoz);
  }
}

pub struct MemDinoparcStore<TyClock: Clock> {
  clock: TyClock,
  state: RwLock<StoreState>,
}

impl<TyClock> MemDinoparcStore<TyClock>
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
impl<TyClock> DinoparcStore for MemDinoparcStore<TyClock>
where
  TyClock: Clock,
{
  async fn touch_short_user(&self, short: &ShortDinoparcUser) -> Result<ArchivedDinoparcUser, AnyError> {
    let mut state = self.state.write().unwrap();
    let now = self.clock.now();
    let u = state.touch_user(now, short.clone());
    Ok((&*u).into())
  }

  async fn touch_inventory(&self, response: &DinoparcInventoryResponse) -> Result<(), AnyError> {
    let mut state = self.state.write().unwrap();
    let now = self.clock.now();
    state.touch_inventory(now, response);
    Ok(())
  }

  async fn touch_collection(&self, response: &DinoparcCollectionResponse) -> Result<(), AnyError> {
    let mut state = self.state.write().unwrap();
    let now = self.clock.now();
    state.touch_collection(now, response);
    Ok(())
  }

  async fn touch_dinoz(&self, response: &DinoparcDinozResponse) -> Result<(), AnyError> {
    let mut state = self.state.write().unwrap();
    let now = self.clock.now();
    state.touch_dinoz_profile(now, response);
    Ok(())
  }

  async fn touch_exchange_with(&self, response: &DinoparcExchangeWithResponse) -> Result<(), AnyError> {
    let mut state = self.state.write().unwrap();
    let now = self.clock.now();
    state.touch_exchange_with(now, response);
    Ok(())
  }

  async fn get_dinoz(&self, options: &GetDinoparcDinozOptions) -> Result<Option<ArchivedDinoparcDinoz>, AnyError> {
    let state = self.state.read().unwrap();
    Ok(
      state
        .get_dinoz(&options.id.and_server(options.server))
        .map(|d| state.to_archived_dinoz(d)),
    )
  }

  async fn get_user(&self, options: &GetDinoparcUserOptions) -> Result<Option<ArchivedDinoparcUser>, AnyError> {
    let state = self.state.read().unwrap();
    Ok(state.get_user(&options.id.and_server(options.server)).map(|u| u.into()))
  }
}

#[cfg(feature = "neon")]
impl<TyClock> neon::prelude::Finalize for MemDinoparcStore<TyClock> where TyClock: Clock {}

#[cfg(test)]
mod test {
  use crate::mem::MemDinoparcStore;
  use crate::test::TestApi;
  use etwin_core::clock::VirtualClock;
  use etwin_core::core::Instant;
  use etwin_core::dinoparc::DinoparcStore;
  use std::sync::Arc;

  fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn DinoparcStore>> {
    let clock = Arc::new(VirtualClock::new(Instant::ymd_hms(2020, 1, 1, 0, 0, 0)));
    let dinoparc_store: Arc<dyn DinoparcStore> = Arc::new(MemDinoparcStore::new(Arc::clone(&clock)));

    TestApi { clock, dinoparc_store }
  }

  test_dinoparc_store!(|| make_test_api());
}
