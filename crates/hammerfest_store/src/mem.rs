use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::hammerfest::{
  GetHammerfestUserOptions, HammerfestForumThemePage, HammerfestForumThreadPage, HammerfestGodchild, HammerfestItemId,
  HammerfestProfile, HammerfestShop, HammerfestStore, HammerfestUserId, ShortHammerfestUser, StoredHammerfestUser,
};
use etwin_core::types::EtwinError;
use std::collections::HashMap;
use std::sync::RwLock;

struct StoreState {
  users: HashMap<HammerfestUserId, StoredHammerfestUser>,
}

impl StoreState {
  fn new() -> Self {
    Self { users: HashMap::new() }
  }

  fn get_user(&self, id: &HammerfestUserId) -> Option<&StoredHammerfestUser> {
    self.users.get(id)
  }

  fn touch_user(&mut self, user: StoredHammerfestUser) {
    self.users.insert(user.id, user);
  }
}

pub struct MemHammerfestStore<TyClock: Clock> {
  clock: TyClock,
  state: RwLock<StoreState>,
}

impl<TyClock> MemHammerfestStore<TyClock>
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
impl<TyClock> HammerfestStore for MemHammerfestStore<TyClock>
where
  TyClock: Clock,
{
  async fn get_short_user(
    &self,
    options: &GetHammerfestUserOptions,
  ) -> Result<Option<ShortHammerfestUser>, EtwinError> {
    let state = self.state.read().unwrap();
    Ok(state.get_user(&options.id).cloned().map(From::from))
  }

  async fn get_user(&self, options: &GetHammerfestUserOptions) -> Result<Option<StoredHammerfestUser>, EtwinError> {
    let state = self.state.read().unwrap();
    Ok(state.get_user(&options.id).cloned())
  }

  async fn touch_short_user(&self, short: &ShortHammerfestUser) -> Result<StoredHammerfestUser, EtwinError> {
    let mut state = self.state.write().unwrap();
    let now = self.clock.now();
    let user = StoredHammerfestUser {
      server: short.server,
      id: short.id,
      username: short.username.clone(),
      archived_at: now,
      profile: None,
      items: None,
    };
    state.touch_user(user.clone());
    Ok(user)
  }

  async fn touch_shop(&self, _user: &ShortHammerfestUser, _options: &HammerfestShop) -> Result<(), EtwinError> {
    unimplemented!()
  }

  async fn touch_profile(&self, _options: &HammerfestProfile) -> Result<(), EtwinError> {
    unimplemented!()
  }

  async fn touch_inventory(
    &self,
    _user: &ShortHammerfestUser,
    _inventory: &HashMap<HammerfestItemId, u32>,
  ) -> Result<(), EtwinError> {
    unimplemented!()
  }

  async fn touch_godchildren(
    &self,
    _user: &ShortHammerfestUser,
    _godchildren: &[HammerfestGodchild],
  ) -> Result<(), EtwinError> {
    unimplemented!()
  }

  async fn touch_theme_page(&self, _options: &HammerfestForumThemePage) -> Result<(), EtwinError> {
    unimplemented!()
  }

  async fn touch_thread_page(&self, _options: &HammerfestForumThreadPage) -> Result<(), EtwinError> {
    unimplemented!()
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
      clock,
      hammerfest_store,
    }
  }

  test_hammerfest_store!(|| make_test_api());
}
