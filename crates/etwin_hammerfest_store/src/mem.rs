use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::hammerfest::{HammerfestStore, HammerfestUserId, GetHammerfestUserOptions, ShortHammerfestUser};
use std::collections::HashMap;
use std::error::Error;
use std::ops::Deref;
use std::sync::Mutex;

struct StoreState {
  users: HashMap<HammerfestUserId, ShortHammerfestUser>,
}

impl StoreState {
  fn new() -> Self {
    Self { users: HashMap::new() }
  }

  fn get_user(&self, id: &HammerfestUserId) -> Option<&ShortHammerfestUser> {
    self.users.get(id)
  }

  fn touch_user(&mut self, user: ShortHammerfestUser) {
    self.users.insert(user.id.clone(), user);
  }
}

pub struct MemHammerfestStore<TyClock>
  where
    TyClock: Deref + Send + Sync,
    <TyClock as Deref>::Target: Clock,
{
  _clock: TyClock,
  state: Mutex<StoreState>,
}

impl<TyClock> MemHammerfestStore<TyClock>
  where
    TyClock: Deref + Send + Sync,
    <TyClock as Deref>::Target: Clock,
{
  pub fn new(clock: TyClock) -> Self {
    Self {
      _clock: clock,
      state: Mutex::new(StoreState::new()),
    }
  }
}

#[async_trait]
impl<TyClock> HammerfestStore for MemHammerfestStore<TyClock>
  where
    TyClock: Deref + Send + Sync,
    <TyClock as Deref>::Target: Clock,
{
  async fn get_short_user(&self, options: &GetHammerfestUserOptions) -> Result<Option<ShortHammerfestUser>, Box<dyn Error>> {
    let state = self.state.lock().unwrap();
    Ok(state.get_user(&options.id).cloned())
  }

  async fn touch_short_user(&self, short: &ShortHammerfestUser) -> Result<ShortHammerfestUser, Box<dyn Error>> {
    let mut state = self.state.lock().unwrap();
    state.touch_user(short.clone());
    Ok(short.clone())
  }
}

#[cfg(test)]
mod test {
  use crate::test::{TestApi};
  use etwin_core::clock::VirtualClock;
  use chrono::{TimeZone, Utc};
  use std::sync::Arc;
  use etwin_core::hammerfest::HammerfestStore;
  use crate::mem::MemHammerfestStore;

  fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn HammerfestStore>> {
    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let hammerfest_store: Arc<dyn HammerfestStore> = Arc::new(MemHammerfestStore::new(Arc::clone(&clock)));

    TestApi { _clock: clock, hammerfest_store }
  }

  #[tokio::test]
  async fn test_empty() {
    crate::test::test_empty(make_test_api()).await;
  }

  #[tokio::test]
  async fn test_touch_user() {
    crate::test::test_touch_user(make_test_api()).await;
  }
}
