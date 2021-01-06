use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::hammerfest::{
  ArchivedHammerfestUser, GetHammerfestUserOptions, HammerfestStore, HammerfestUserId, ShortHammerfestUser,
};
use std::collections::HashMap;
use std::error::Error;
use std::sync::Mutex;

struct StoreState {
  users: HashMap<HammerfestUserId, ArchivedHammerfestUser>,
}

impl StoreState {
  fn new() -> Self {
    Self { users: HashMap::new() }
  }

  fn get_user(&self, id: &HammerfestUserId) -> Option<&ArchivedHammerfestUser> {
    self.users.get(id)
  }

  fn touch_user(&mut self, user: ArchivedHammerfestUser) {
    self.users.insert(user.id.clone(), user);
  }
}

pub struct MemHammerfestStore<TyClock: Clock> {
  clock: TyClock,
  state: Mutex<StoreState>,
}

impl<TyClock> MemHammerfestStore<TyClock>
where
  TyClock: Clock,
{
  pub fn new(clock: TyClock) -> Self {
    Self {
      clock,
      state: Mutex::new(StoreState::new()),
    }
  }
}

#[async_trait]
impl<TyClock> HammerfestStore for MemHammerfestStore<TyClock>
where
  TyClock: Clock,
{
  async fn get_short_user(
    &self,
    options: &GetHammerfestUserOptions,
  ) -> Result<Option<ShortHammerfestUser>, Box<dyn Error>> {
    let state = self.state.lock().unwrap();
    Ok(state.get_user(&options.id).cloned().map(From::from))
  }

  async fn get_user(
    &self,
    options: &GetHammerfestUserOptions,
  ) -> Result<Option<ArchivedHammerfestUser>, Box<dyn Error>> {
    let state = self.state.lock().unwrap();
    Ok(state.get_user(&options.id).cloned())
  }

  async fn touch_short_user(&self, short: &ShortHammerfestUser) -> Result<ArchivedHammerfestUser, Box<dyn Error>> {
    let mut state = self.state.lock().unwrap();
    let now = self.clock.now();
    let user = ArchivedHammerfestUser {
      server: short.server,
      id: short.id.clone(),
      username: short.username.clone(),
      archived_at: now,
      profile: None,
      items: None,
    };
    state.touch_user(user.clone());
    Ok(user)
  }
}

#[cfg(feature = "neon")]
impl<TyClock> neon::prelude::Finalize for MemHammerfestStore<TyClock> where TyClock: Clock {}

#[cfg(test)]
mod test {
  use crate::mem::MemHammerfestStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::hammerfest::HammerfestStore;
  use std::sync::Arc;

  fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn HammerfestStore>> {
    let clock = Arc::new(VirtualClock::new(Utc.ymd(2020, 1, 1).and_hms(0, 0, 0)));
    let hammerfest_store: Arc<dyn HammerfestStore> = Arc::new(MemHammerfestStore::new(Arc::clone(&clock)));

    TestApi {
      clock: clock,
      hammerfest_store,
    }
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
