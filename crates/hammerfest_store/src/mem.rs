use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::hammerfest::{
  GetHammerfestUserOptions, HammerfestForumThemePageResponse, HammerfestForumThreadPageResponse,
  HammerfestGodchildrenResponse, HammerfestInventoryResponse, HammerfestProfileResponse, HammerfestShopResponse,
  HammerfestStore, HammerfestUserId, ShortHammerfestUser, StoredHammerfestUser,
};
use etwin_core::types::AnyError;
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
  async fn get_short_user(&self, options: &GetHammerfestUserOptions) -> Result<Option<ShortHammerfestUser>, AnyError> {
    let state = self.state.read().unwrap();
    Ok(state.get_user(&options.id).cloned().map(From::from))
  }

  async fn get_user(&self, options: &GetHammerfestUserOptions) -> Result<Option<StoredHammerfestUser>, AnyError> {
    let state = self.state.read().unwrap();
    Ok(state.get_user(&options.id).cloned())
  }

  async fn touch_short_user(&self, short: &ShortHammerfestUser) -> Result<StoredHammerfestUser, AnyError> {
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

  async fn touch_shop(&self, _response: &HammerfestShopResponse) -> Result<(), AnyError> {
    eprintln!("Stub: Incomplete `MemHammerfestSore::touch_shop` implementation");
    Ok(())
  }

  async fn touch_profile(&self, _response: &HammerfestProfileResponse) -> Result<(), AnyError> {
    eprintln!("Stub: Incomplete `MemHammerfestSore::touch_profile` implementation");
    Ok(())
  }

  async fn touch_inventory(&self, _respone: &HammerfestInventoryResponse) -> Result<(), AnyError> {
    eprintln!("Stub: Incomplete `MemHammerfestSore::touch_inventory` implementation");
    Ok(())
  }

  async fn touch_godchildren(&self, _response: &HammerfestGodchildrenResponse) -> Result<(), AnyError> {
    eprintln!("Stub: Incomplete `MemHammerfestSore::touch_godchildren` implementation");
    Ok(())
  }

  async fn touch_theme_page(&self, _response: &HammerfestForumThemePageResponse) -> Result<(), AnyError> {
    eprintln!("Stub: Incomplete `MemHammerfestSore::touch_theme_page` implementation");
    Ok(())
  }

  async fn touch_thread_page(&self, _response: &HammerfestForumThreadPageResponse) -> Result<(), AnyError> {
    eprintln!("Stub: Incomplete `MemHammerfestSore::touch_thread_page` implementation");
    Ok(())
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
