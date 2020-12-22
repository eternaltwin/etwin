use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::dinoparc::{DinoparcStore, DinoparcUserId, GetDinoparcUserOptions, ShortDinoparcUser};
use std::collections::HashMap;
use std::error::Error;
use std::ops::Deref;
use std::sync::Mutex;

struct StoreState {
  users: HashMap<DinoparcUserId, ShortDinoparcUser>,
}

impl StoreState {
  fn new() -> Self {
    Self { users: HashMap::new() }
  }

  fn get_user(&self, id: &DinoparcUserId) -> Option<&ShortDinoparcUser> {
    self.users.get(id)
  }

  fn touch_user(&mut self, user: ShortDinoparcUser) {
    self.users.insert(user.id.clone(), user);
  }
}

pub struct MemDinoparcStore<C>
  where
    C: Deref + Send + Sync,
    <C as Deref>::Target: Clock,
{
  _clock: C,
  state: Mutex<StoreState>,
}

impl<C> MemDinoparcStore<C>
  where
    C: Deref + Send + Sync,
    <C as Deref>::Target: Clock,
{
  pub fn new(clock: C) -> Self {
    Self {
      _clock: clock,
      state: Mutex::new(StoreState::new()),
    }
  }
}

#[async_trait]
impl<C> DinoparcStore for MemDinoparcStore<C>
  where
    C: Deref + Send + Sync,
    <C as Deref>::Target: Clock,
{
  async fn get_short_user(&self, options: &GetDinoparcUserOptions) -> Result<Option<ShortDinoparcUser>, Box<dyn Error>> {
    let state = self.state.lock().unwrap();
    Ok(state.get_user(&options.id).cloned())
  }

  async fn touch_short_user(&self, short: &ShortDinoparcUser) -> Result<ShortDinoparcUser, Box<dyn Error>> {
    let mut state = self.state.lock().unwrap();
    state.touch_user(short.clone());
    Ok(short.clone())
  }
}

#[cfg(test)]
mod test {
  use crate::test::{TestApi, test_empty};
  use etwin_core::clock::VirtualClock;
  use chrono::{TimeZone, Utc};
  use std::sync::Arc;
  use etwin_core::dinoparc::DinoparcStore;
  use crate::mem::MemDinoparcStore;

  fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn DinoparcStore>> {
    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let dinoparc_store: Arc<dyn DinoparcStore> = Arc::new(MemDinoparcStore::new(Arc::clone(&clock)));

    TestApi { _clock: clock, dinoparc_store }
  }

  #[tokio::test]
  async fn test_user_store() {
    test_empty(make_test_api()).await;
  }
}
