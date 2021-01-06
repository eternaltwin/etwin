use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::dinoparc::{
  ArchivedDinoparcUser, DinoparcStore, DinoparcUserId, GetDinoparcUserOptions, ShortDinoparcUser,
};
use std::collections::HashMap;
use std::error::Error;
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
    self.users.insert(user.id.clone(), user);
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
      clock: clock,
      state: RwLock::new(StoreState::new()),
    }
  }
}

#[async_trait]
impl<TyClock> DinoparcStore for MemDinoparcStore<TyClock>
where
  TyClock: Clock,
{
  async fn get_short_user(
    &self,
    options: &GetDinoparcUserOptions,
  ) -> Result<Option<ArchivedDinoparcUser>, Box<dyn Error>> {
    let state = self.state.read().unwrap();
    Ok(state.get_user(&options.id).cloned())
  }

  async fn touch_short_user(&self, short: &ShortDinoparcUser) -> Result<ArchivedDinoparcUser, Box<dyn Error>> {
    let mut state = self.state.write().unwrap();
    let now = self.clock.now();
    let user = ArchivedDinoparcUser {
      server: short.server,
      id: short.id.clone(),
      username: short.username.clone(),
      archived_at: now,
    };
    state.touch_user(user.clone());
    Ok(user)
  }
}

#[cfg(feature = "neon")]
impl<TyClock> neon::prelude::Finalize for MemDinoparcStore<TyClock> where TyClock: Clock {}

#[cfg(test)]
mod test {
  use crate::mem::MemDinoparcStore;
  use crate::test::{test_empty, TestApi};
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::dinoparc::DinoparcStore;
  use std::sync::Arc;

  fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn DinoparcStore>> {
    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let dinoparc_store: Arc<dyn DinoparcStore> = Arc::new(MemDinoparcStore::new(Arc::clone(&clock)));

    TestApi {
      _clock: clock,
      dinoparc_store,
    }
  }

  #[tokio::test]
  async fn test_user_store() {
    test_empty(make_test_api()).await;
  }
}
