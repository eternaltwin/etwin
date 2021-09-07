use async_trait::async_trait;
use etwin_core::auth::{
  AuthStore, CreateSessionOptions, CreateValidatedEmailVerificationOptions, RawSession, SessionId,
};
use etwin_core::clock::Clock;
use etwin_core::core::Instant;
use etwin_core::types::AnyError;
use etwin_core::uuid::UuidGenerator;
use std::collections::HashMap;
use std::sync::RwLock;

struct StoreState {
  sessions: HashMap<SessionId, RawSession>,
}

impl StoreState {
  fn new() -> Self {
    Self {
      sessions: HashMap::new(),
    }
  }

  pub(crate) fn create_session(
    &mut self,
    now: Instant,
    uuid_generator: &impl UuidGenerator,
    options: &CreateSessionOptions,
  ) -> Result<RawSession, AnyError> {
    let session_id = SessionId::from_uuid(uuid_generator.next());
    let session = RawSession {
      id: session_id,
      user: options.user,
      ctime: now,
      atime: now,
    };
    self.sessions.insert(session_id, session.clone());
    Ok(session)
  }

  pub(crate) fn get_and_touch_session(
    &mut self,
    now: Instant,
    session_id: SessionId,
  ) -> Result<Option<RawSession>, AnyError> {
    let session = self.sessions.get_mut(&session_id);
    match session {
      None => Ok(None),
      Some(session) => {
        session.atime = now;
        Ok(Some(session.clone()))
      }
    }
  }
}

pub struct MemAuthStore<TyClock, TyUuidGenerator>
where
  TyClock: Clock,
  TyUuidGenerator: UuidGenerator,
{
  clock: TyClock,
  uuid_generator: TyUuidGenerator,
  state: RwLock<StoreState>,
}

impl<TyClock, TyUuidGenerator> MemAuthStore<TyClock, TyUuidGenerator>
where
  TyClock: Clock,
  TyUuidGenerator: UuidGenerator,
{
  pub fn new(clock: TyClock, uuid_generator: TyUuidGenerator) -> Self {
    Self {
      clock,
      uuid_generator,
      state: RwLock::new(StoreState::new()),
    }
  }
}

#[async_trait]
impl<TyClock, TyUuidGenerator> AuthStore for MemAuthStore<TyClock, TyUuidGenerator>
where
  TyClock: Clock,
  TyUuidGenerator: UuidGenerator,
{
  async fn create_validated_email_verification(
    &self,
    _options: &CreateValidatedEmailVerificationOptions,
  ) -> Result<(), AnyError> {
    eprintln!("Warning: PgAuthStore#create_validated_email_verification is a no-op stub");
    Ok(())
  }

  async fn create_session(&self, options: &CreateSessionOptions) -> Result<RawSession, AnyError> {
    let now = self.clock.now();
    let mut state = self.state.write().unwrap();
    state.create_session(now, &self.uuid_generator, options)
  }

  async fn get_and_touch_session(&self, session: SessionId) -> Result<Option<RawSession>, AnyError> {
    let now = self.clock.now();
    let mut state = self.state.write().unwrap();
    state.get_and_touch_session(now, session)
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyUuidGenerator> neon::prelude::Finalize for MemAuthStore<TyClock, TyUuidGenerator>
where
  TyClock: Clock,
  TyUuidGenerator: UuidGenerator,
{
}

#[cfg(test)]
mod test {
  use crate::mem::MemAuthStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::auth::AuthStore;
  use etwin_core::clock::VirtualClock;
  use etwin_core::user::UserStore;
  use etwin_core::uuid::Uuid4Generator;
  use etwin_user_store::mem::MemUserStore;
  use std::sync::Arc;

  fn make_test_api() -> TestApi<Arc<dyn AuthStore>, Arc<VirtualClock>, Arc<dyn UserStore>> {
    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let uuid_generator = Arc::new(Uuid4Generator);
    let auth_store: Arc<dyn AuthStore> = Arc::new(MemAuthStore::new(Arc::clone(&clock), uuid_generator));
    let user_store: Arc<dyn UserStore> = Arc::new(MemUserStore::new(Arc::clone(&clock), Uuid4Generator));

    TestApi {
      auth_store,
      clock,
      user_store,
    }
  }

  test_dinoparc_store!(|| make_test_api());
}
