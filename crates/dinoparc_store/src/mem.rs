use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::dinoparc::{
  ArchivedDinoparcDinoz, ArchivedDinoparcUser, DinoparcDinozResponse, DinoparcInventoryResponse, DinoparcStore,
  DinoparcUserId, GetDinoparcDinozOptions, GetDinoparcUserOptions, ShortDinoparcUser,
};
use etwin_core::types::EtwinError;
use std::collections::HashMap;
use std::sync::RwLock;

struct StoreState {
  users: HashMap<DinoparcUserId, ArchivedDinoparcUser>,
}

impl StoreState {
  fn new() -> Self {
    Self { users: HashMap::new() }
  }

  fn get_user(&self, id: &DinoparcUserId) -> Option<&ArchivedDinoparcUser> {
    self.users.get(id)
  }

  fn touch_user(&mut self, user: ArchivedDinoparcUser) {
    self.users.insert(user.id, user);
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
  async fn touch_short_user(&self, short: &ShortDinoparcUser) -> Result<ArchivedDinoparcUser, EtwinError> {
    let mut state = self.state.write().unwrap();
    let now = self.clock.now();
    let user = ArchivedDinoparcUser {
      server: short.server,
      id: short.id,
      archived_at: now,
      username: short.username.clone(),
      coins: None,
      dinoz: None,
      inventory: None,
    };
    state.touch_user(user.clone());
    Ok(user)
  }

  async fn touch_inventory(&self, _response: &DinoparcInventoryResponse) -> Result<(), EtwinError> {
    todo!()
  }

  async fn touch_dinoz(&self, _response: &DinoparcDinozResponse) -> Result<(), EtwinError> {
    todo!()
  }

  async fn get_dinoz(&self, _options: &GetDinoparcDinozOptions) -> Result<Option<ArchivedDinoparcDinoz>, EtwinError> {
    todo!()
  }

  async fn get_user(&self, options: &GetDinoparcUserOptions) -> Result<Option<ArchivedDinoparcUser>, EtwinError> {
    let state = self.state.read().unwrap();
    Ok(state.get_user(&options.id).cloned())
  }
}

#[cfg(feature = "neon")]
impl<TyClock> neon::prelude::Finalize for MemDinoparcStore<TyClock> where TyClock: Clock {}

#[cfg(test)]
mod test {
  use crate::mem::MemDinoparcStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::dinoparc::DinoparcStore;
  use std::sync::Arc;

  fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn DinoparcStore>> {
    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let dinoparc_store: Arc<dyn DinoparcStore> = Arc::new(MemDinoparcStore::new(Arc::clone(&clock)));

    TestApi { clock, dinoparc_store }
  }

  test_dinoparc_store!(|| make_test_api());
}
