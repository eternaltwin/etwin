use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::core::Instant;
use etwin_core::dinoparc::{DinoparcServer, DinoparcSessionKey, DinoparcUserIdRef, StoredDinoparcSession};
use etwin_core::hammerfest::{HammerfestServer, HammerfestSessionKey, HammerfestUserIdRef, StoredHammerfestSession};
use etwin_core::oauth::{RfcOauthAccessTokenKey, RfcOauthRefreshTokenKey, TwinoidAccessToken, TwinoidRefreshToken};
use etwin_core::token::{TokenStore, TouchOauthTokenOptions, TwinoidOauth};
use etwin_core::twinoid::{TwinoidUserId, TwinoidUserIdRef};
use etwin_core::types::EtwinError;
use std::collections::HashMap;
use std::fmt::Debug;
use std::sync::RwLock;

struct MemDinoparcServers {
  dinoparc_com: MemSessions<StoredDinoparcSession>,
  en_dinoparc_com: MemSessions<StoredDinoparcSession>,
  sp_dinoparc_com: MemSessions<StoredDinoparcSession>,
}

impl MemDinoparcServers {
  fn new() -> Self {
    Self {
      dinoparc_com: MemSessions::new(),
      en_dinoparc_com: MemSessions::new(),
      sp_dinoparc_com: MemSessions::new(),
    }
  }

  fn get(&self, server: DinoparcServer) -> &MemSessions<StoredDinoparcSession> {
    match server {
      DinoparcServer::DinoparcCom => &self.dinoparc_com,
      DinoparcServer::EnDinoparcCom => &self.en_dinoparc_com,
      DinoparcServer::SpDinoparcCom => &self.sp_dinoparc_com,
    }
  }

  fn get_mut(&mut self, server: DinoparcServer) -> &mut MemSessions<StoredDinoparcSession> {
    match server {
      DinoparcServer::DinoparcCom => &mut self.dinoparc_com,
      DinoparcServer::EnDinoparcCom => &mut self.en_dinoparc_com,
      DinoparcServer::SpDinoparcCom => &mut self.sp_dinoparc_com,
    }
  }
}

struct MemHammerfestServers {
  hammerfest_fr: MemSessions<StoredHammerfestSession>,
  hammerfest_es: MemSessions<StoredHammerfestSession>,
  hfest_net: MemSessions<StoredHammerfestSession>,
}

impl MemHammerfestServers {
  fn new() -> Self {
    Self {
      hammerfest_fr: MemSessions::new(),
      hammerfest_es: MemSessions::new(),
      hfest_net: MemSessions::new(),
    }
  }

  fn get(&self, server: HammerfestServer) -> &MemSessions<StoredHammerfestSession> {
    match server {
      HammerfestServer::HammerfestFr => &self.hammerfest_fr,
      HammerfestServer::HfestNet => &self.hfest_net,
      HammerfestServer::HammerfestEs => &self.hammerfest_es,
    }
  }

  fn get_mut(&mut self, server: HammerfestServer) -> &mut MemSessions<StoredHammerfestSession> {
    match server {
      HammerfestServer::HammerfestFr => &mut self.hammerfest_fr,
      HammerfestServer::HfestNet => &mut self.hfest_net,
      HammerfestServer::HammerfestEs => &mut self.hammerfest_es,
    }
  }
}

struct MemSessions<Session: MemSession> {
  sessions: HashMap<Session::SessionKey, Session>,
  session_by_user: HashMap<Session::UserId, Session::SessionKey>,
}

impl<Session: MemSession> MemSessions<Session> {
  fn new() -> Self {
    Self {
      sessions: HashMap::new(),
      session_by_user: HashMap::new(),
    }
  }

  fn touch(&mut self, now: Instant, key: &Session::SessionKey, user: Session::UserId) -> Session {
    touch_session(&mut self.sessions, &mut self.session_by_user, now, key, user)
  }

  fn get(&self, user: Session::UserId) -> Option<Session> {
    get_session(&self.sessions, &self.session_by_user, &user).cloned()
  }

  fn revoke(&mut self, key: &Session::SessionKey) {
    revoke_session::<Session>(&mut self.sessions, &mut self.session_by_user, key)
  }
}

trait MemSession: Clone {
  type SessionKey: Debug + Clone + Eq + core::hash::Hash;
  type UserId: Debug + Clone + Eq + core::hash::Hash;

  fn new(now: Instant, key: Self::SessionKey, user_id: Self::UserId) -> Self;

  fn user_id(&self) -> &Self::UserId;

  fn atime_mut(&mut self) -> &mut Instant;
}

fn touch_session<Session: MemSession>(
  sessions: &mut HashMap<Session::SessionKey, Session>,
  session_by_user: &mut HashMap<Session::UserId, Session::SessionKey>,
  now: Instant,
  key: &Session::SessionKey,
  user_id: Session::UserId,
) -> Session {
  let old_session = sessions.get_mut(key);
  if let Some(old_session) = old_session {
    let old_user_id = old_session.user_id();
    if old_user_id == &user_id {
      // Same user: simply update atime
      *old_session.atime_mut() = now;
      old_session.clone()
    } else {
      // User changed: revoke and insert
      session_by_user.remove(old_user_id);
      session_by_user.insert(user_id.clone(), key.clone());
      let session = Session::new(now, key.clone(), user_id);
      sessions.insert(key.clone(), session.clone());
      session
    }
  } else {
    // Fresh insert
    session_by_user.insert(user_id.clone(), key.clone());
    let session = Session::new(now, key.clone(), user_id);
    sessions.insert(key.clone(), session.clone());
    session
  }
}

fn get_session<'a, Session: MemSession>(
  sessions: &'a HashMap<Session::SessionKey, Session>,
  session_by_user: &HashMap<Session::UserId, Session::SessionKey>,
  user_id: &Session::UserId,
) -> Option<&'a Session> {
  let key = session_by_user.get(user_id)?;
  Some(sessions.get(key).unwrap())
}

impl MemSession for StoredHammerfestSession {
  type SessionKey = HammerfestSessionKey;
  type UserId = HammerfestUserIdRef;

  fn new(now: Instant, key: Self::SessionKey, user_id: Self::UserId) -> Self {
    Self {
      key,
      user: user_id,
      ctime: now,
      atime: now,
    }
  }

  fn user_id(&self) -> &Self::UserId {
    &self.user
  }

  fn atime_mut(&mut self) -> &mut Instant {
    &mut self.atime
  }
}

impl MemSession for StoredDinoparcSession {
  type SessionKey = DinoparcSessionKey;
  type UserId = DinoparcUserIdRef;

  fn new(now: Instant, key: Self::SessionKey, user_id: Self::UserId) -> Self {
    Self {
      key,
      user: user_id,
      ctime: now,
      atime: now,
    }
  }

  fn user_id(&self) -> &Self::UserId {
    &self.user
  }

  fn atime_mut(&mut self) -> &mut Instant {
    &mut self.atime
  }
}

fn revoke_session<Session: MemSession>(
  sessions: &mut HashMap<Session::SessionKey, Session>,
  session_by_user: &mut HashMap<Session::UserId, Session::SessionKey>,
  key: &Session::SessionKey,
) {
  let session = sessions.remove(key);
  if let Some(session) = session {
    let old_key = session_by_user.remove(session.user_id());
    debug_assert_eq!(old_key.as_ref(), Some(key))
  }
}

struct StoreState {
  twinoid_access_tokens: HashMap<RfcOauthAccessTokenKey, TwinoidAccessToken>,
  twinoid_refresh_tokens: HashMap<RfcOauthRefreshTokenKey, TwinoidRefreshToken>,
  twinoid_user_to_access_token: HashMap<TwinoidUserId, RfcOauthAccessTokenKey>,
  twinoid_user_to_refresh_token: HashMap<TwinoidUserId, RfcOauthRefreshTokenKey>,
  dinoparc: MemDinoparcServers,
  hammerfest: MemHammerfestServers,
}

impl StoreState {
  fn new() -> Self {
    Self {
      twinoid_access_tokens: HashMap::new(),
      twinoid_refresh_tokens: HashMap::new(),
      twinoid_user_to_access_token: HashMap::new(),
      twinoid_user_to_refresh_token: HashMap::new(),
      dinoparc: MemDinoparcServers::new(),
      hammerfest: MemHammerfestServers::new(),
    }
  }

  fn get_twinoid_oauth(&self, now: Instant, id: TwinoidUserIdRef) -> TwinoidOauth {
    let refresh_token = {
      let refresh_key = self.twinoid_user_to_refresh_token.get(&id.id);
      refresh_key.map(|refresh_key| self.twinoid_refresh_tokens.get(refresh_key).unwrap().clone())
    };
    let access_token = {
      let access_key = self.twinoid_user_to_access_token.get(&id.id);
      match access_key {
        Some(access_key) => {
          let at = self.twinoid_access_tokens.get(access_key).unwrap();
          if now >= at.expires_at {
            None
          } else {
            Some(at.clone())
          }
        }
        None => None,
      }
    };
    TwinoidOauth {
      access_token,
      refresh_token,
    }
  }

  fn touch_twinoid_oauth(&mut self, now: Instant, options: &TouchOauthTokenOptions) {
    {
      let old_user_id = self
        .twinoid_refresh_tokens
        .get(&options.refresh_token)
        .map(|t| t.twinoid_user_id);
      if let Some(old_user_id) = old_user_id {
        if old_user_id != options.twinoid_user_id {
          self.twinoid_refresh_tokens.remove(&options.refresh_token);
        }
      }
    }
    {
      let old_user_id = self
        .twinoid_access_tokens
        .get(&options.access_token)
        .map(|t| t.twinoid_user_id);
      if let Some(old_user_id) = old_user_id {
        if old_user_id != options.twinoid_user_id {
          self.twinoid_access_tokens.remove(&options.access_token);
        }
      }
    }
    self
      .twinoid_refresh_tokens
      .entry(options.refresh_token.clone())
      .and_modify(|rt| rt.accessed_at = now)
      .or_insert_with(|| TwinoidRefreshToken {
        key: options.refresh_token.clone(),
        created_at: now,
        accessed_at: now,
        twinoid_user_id: options.twinoid_user_id,
      });

    self
      .twinoid_access_tokens
      .entry(options.access_token.clone())
      .and_modify(|rt| rt.accessed_at = now)
      .or_insert_with(|| TwinoidAccessToken {
        key: options.access_token.clone(),
        created_at: now,
        accessed_at: now,
        expires_at: options.expiration_time,
        twinoid_user_id: options.twinoid_user_id,
      });

    {
      let old_refresh_key = self
        .twinoid_user_to_refresh_token
        .insert(options.twinoid_user_id, options.refresh_token.clone());
      if let Some(old_refresh_key) = old_refresh_key {
        if old_refresh_key != options.refresh_token {
          self.twinoid_refresh_tokens.remove(&old_refresh_key);
        }
      }
    }
    {
      let old_access_key = self
        .twinoid_user_to_access_token
        .insert(options.twinoid_user_id, options.access_token.clone());
      if let Some(old_access_key) = old_access_key {
        if old_access_key != options.access_token {
          self.twinoid_access_tokens.remove(&old_access_key);
        }
      }
    }
  }

  fn revoke_twinoid_access_token(&mut self, options: &RfcOauthAccessTokenKey) {
    let token = self.twinoid_access_tokens.remove(options);
    if let Some(token) = token {
      let old = self.twinoid_user_to_access_token.remove(&token.twinoid_user_id);
      debug_assert_eq!(old.as_ref(), Some(options));
    }
  }

  fn revoke_twinoid_refresh_token(&mut self, options: &RfcOauthRefreshTokenKey) {
    let token = self.twinoid_refresh_tokens.remove(options);
    if let Some(token) = token {
      let old = self.twinoid_user_to_refresh_token.remove(&token.twinoid_user_id);
      debug_assert_eq!(old.as_ref(), Some(options));
    }
  }
}

pub struct MemTokenStore<TyClock: Clock> {
  clock: TyClock,
  state: RwLock<StoreState>,
}

impl<TyClock> MemTokenStore<TyClock>
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
impl<TyClock> TokenStore for MemTokenStore<TyClock>
where
  TyClock: Clock,
{
  async fn touch_twinoid_oauth(&self, options: &TouchOauthTokenOptions) -> Result<(), EtwinError> {
    let mut state = self.state.write().unwrap();
    let now = self.clock.now();
    state.touch_twinoid_oauth(now, options);
    Ok(())
  }

  async fn revoke_twinoid_access_token(&self, options: &RfcOauthAccessTokenKey) -> Result<(), EtwinError> {
    let mut state = self.state.write().unwrap();
    state.revoke_twinoid_access_token(options);
    Ok(())
  }

  async fn revoke_twinoid_refresh_token(&self, options: &RfcOauthRefreshTokenKey) -> Result<(), EtwinError> {
    let mut state = self.state.write().unwrap();
    state.revoke_twinoid_refresh_token(options);
    Ok(())
  }

  async fn get_twinoid_oauth(&self, options: TwinoidUserIdRef) -> Result<TwinoidOauth, EtwinError> {
    let state = self.state.read().unwrap();
    let now = self.clock.now();
    Ok(state.get_twinoid_oauth(now, options))
  }

  async fn touch_dinoparc(
    &self,
    user: DinoparcUserIdRef,
    key: &DinoparcSessionKey,
  ) -> Result<StoredDinoparcSession, EtwinError> {
    let mut state = self.state.write().unwrap();
    let server = state.dinoparc.get_mut(user.server);
    let now = self.clock.now();
    Ok(server.touch(now, key, user))
  }

  async fn revoke_dinoparc(&self, server: DinoparcServer, key: &DinoparcSessionKey) -> Result<(), EtwinError> {
    let mut state = self.state.write().unwrap();
    let server = state.dinoparc.get_mut(server);
    server.revoke(key);
    Ok(())
  }

  async fn get_dinoparc(&self, user: DinoparcUserIdRef) -> Result<Option<StoredDinoparcSession>, EtwinError> {
    let state = self.state.read().unwrap();
    let server = state.dinoparc.get(user.server);
    Ok(server.get(user))
  }

  async fn touch_hammerfest(
    &self,
    user: HammerfestUserIdRef,
    key: &HammerfestSessionKey,
  ) -> Result<StoredHammerfestSession, EtwinError> {
    let mut state = self.state.write().unwrap();
    let server = state.hammerfest.get_mut(user.server);
    let now = self.clock.now();
    Ok(server.touch(now, key, user))
  }

  async fn revoke_hammerfest(&self, server: HammerfestServer, key: &HammerfestSessionKey) -> Result<(), EtwinError> {
    let mut state = self.state.write().unwrap();
    let server = state.hammerfest.get_mut(server);
    server.revoke(key);
    Ok(())
  }

  async fn get_hammerfest(&self, user: HammerfestUserIdRef) -> Result<Option<StoredHammerfestSession>, EtwinError> {
    let state = self.state.read().unwrap();
    let server = state.hammerfest.get(user.server);
    Ok(server.get(user))
  }
}

#[cfg(feature = "neon")]
impl<TyClock> neon::prelude::Finalize for MemTokenStore<TyClock> where TyClock: Clock {}

#[cfg(test)]
mod test {
  use crate::mem::MemTokenStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::dinoparc::DinoparcStore;
  use etwin_core::hammerfest::HammerfestStore;
  use etwin_core::token::TokenStore;
  use etwin_core::twinoid::TwinoidStore;
  use etwin_dinoparc_store::mem::MemDinoparcStore;
  use etwin_hammerfest_store::mem::MemHammerfestStore;
  use etwin_twinoid_store::mem::MemTwinoidStore;
  use std::sync::Arc;

  #[allow(clippy::type_complexity)]
  fn make_test_api() -> TestApi<
    Arc<VirtualClock>,
    Arc<dyn DinoparcStore>,
    Arc<dyn HammerfestStore>,
    Arc<dyn TokenStore>,
    Arc<dyn TwinoidStore>,
  > {
    let clock = Arc::new(VirtualClock::new(Utc.ymd(2020, 1, 1).and_hms(0, 0, 0)));
    let dinoparc_store: Arc<dyn DinoparcStore> = Arc::new(MemDinoparcStore::new(Arc::clone(&clock)));
    let hammerfest_store: Arc<dyn HammerfestStore> = Arc::new(MemHammerfestStore::new(Arc::clone(&clock)));
    let twinoid_store: Arc<dyn TwinoidStore> = Arc::new(MemTwinoidStore::new(Arc::clone(&clock)));
    let token_store: Arc<dyn TokenStore> = Arc::new(MemTokenStore::new(Arc::clone(&clock)));

    TestApi {
      clock,
      dinoparc_store,
      hammerfest_store,
      token_store,
      twinoid_store,
    }
  }

  test_token_store!(|| make_test_api());
}
