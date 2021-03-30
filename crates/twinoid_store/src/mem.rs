use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::twinoid::{ArchivedTwinoidUser, GetTwinoidUserOptions, ShortTwinoidUser, TwinoidStore, TwinoidUserId};
use etwin_core::types::EtwinError;
use std::collections::HashMap;
use std::sync::RwLock;

struct StoreState {
  users: HashMap<TwinoidUserId, ArchivedTwinoidUser>,
}

impl StoreState {
  fn new() -> Self {
    Self { users: HashMap::new() }
  }

  fn get_user(&self, id: &TwinoidUserId) -> Option<&ArchivedTwinoidUser> {
    self.users.get(id)
  }

  fn touch_user(&mut self, user: ArchivedTwinoidUser) {
    self.users.insert(user.id, user);
  }
}

pub struct MemTwinoidStore<TyClock: Clock> {
  clock: TyClock,
  state: RwLock<StoreState>,
}

impl<TyClock> MemTwinoidStore<TyClock>
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
impl<TyClock> TwinoidStore for MemTwinoidStore<TyClock>
where
  TyClock: Clock,
{
  async fn get_short_user(&self, options: &GetTwinoidUserOptions) -> Result<Option<ShortTwinoidUser>, EtwinError> {
    let state = self.state.read().unwrap();
    Ok(state.get_user(&options.id).cloned().map(From::from))
  }

  async fn get_user(&self, options: &GetTwinoidUserOptions) -> Result<Option<ArchivedTwinoidUser>, EtwinError> {
    let state = self.state.read().unwrap();
    Ok(state.get_user(&options.id).cloned())
  }

  async fn touch_short_user(&self, short: &ShortTwinoidUser) -> Result<ArchivedTwinoidUser, EtwinError> {
    let mut state = self.state.write().unwrap();
    let now = self.clock.now();
    let user = ArchivedTwinoidUser {
      id: short.id,
      archived_at: now,
      display_name: short.display_name.clone(),
    };
    state.touch_user(user.clone());
    Ok(user)
  }
}

#[cfg(feature = "neon")]
impl<TyClock> neon::prelude::Finalize for MemTwinoidStore<TyClock> where TyClock: Clock {}

#[cfg(test)]
mod test {
  use crate::mem::MemTwinoidStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::twinoid::TwinoidStore;
  use std::sync::Arc;

  fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn TwinoidStore>> {
    let clock = Arc::new(VirtualClock::new(Utc.ymd(2020, 1, 1).and_hms(0, 0, 0)));
    let twinoid_store: Arc<dyn TwinoidStore> = Arc::new(MemTwinoidStore::new(Arc::clone(&clock)));

    TestApi { clock, twinoid_store }
  }

  #[tokio::test]
  async fn test_empty() {
    crate::test::test_empty(make_test_api()).await;
  }

  #[tokio::test]
  async fn test_touch_user() {
    crate::test::test_touch_user(make_test_api()).await;
  }

  #[tokio::test]
  async fn test_get_missing_user() {
    crate::test::test_get_missing_user(make_test_api()).await;
  }
}
