use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::core::Instant;
use etwin_core::dinoparc::{
  DinoparcClient, DinoparcCollectionResponse, DinoparcCredentials, DinoparcDinozId, DinoparcDinozResponse,
  DinoparcExchangeWithResponse, DinoparcInventoryResponse, DinoparcPassword, DinoparcServer, DinoparcSession,
  DinoparcSessionKey, DinoparcUserId, DinoparcUsername, ShortDinoparcUser,
};
use etwin_core::types::AnyError;
use std::collections::hash_map::Entry;
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::RwLock;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
  #[error("Invalid credentials")]
  InvalidCredentials,
  #[error("Server not found: {:?}", .0)]
  ServerNotFound(DinoparcServer),
  #[error("Invalid session")]
  InvalidSession,
}

#[derive(Clone, Debug)]
struct MemSession {
  key: DinoparcSessionKey,
  created_at: Instant,
  user_id: DinoparcUserId,
}

#[derive(Clone, Debug)]
struct MemUser {
  id: DinoparcUserId,
  username: DinoparcUsername,
  password: DinoparcPassword,
}

#[derive(Clone, Debug)]
struct MemServer {
  users: HashMap<DinoparcUserId, MemUser>,
  users_by_username: HashMap<DinoparcUsername, DinoparcUserId>,
  sessions: HashMap<DinoparcSessionKey, MemSession>,
  sessions_by_user_id: HashMap<DinoparcUserId, DinoparcSessionKey>,
}

impl MemServer {
  fn new() -> Self {
    Self {
      users: HashMap::new(),
      users_by_username: HashMap::new(),
      sessions: HashMap::new(),
      sessions_by_user_id: HashMap::new(),
    }
  }

  fn get_user_by_username(&self, username: &DinoparcUsername) -> Option<&MemUser> {
    let id = self.users_by_username.get(username);
    id.map(|id| self.users.get(id).unwrap())
  }

  fn create_user(&mut self, id: DinoparcUserId, username: DinoparcUsername, password: DinoparcPassword) {
    let user = MemUser {
      id,
      username: username.clone(),
      password,
    };
    match self.users.entry(id) {
      Entry::Occupied(_) => panic!("DinoparcUserId conflict"),
      Entry::Vacant(e) => e.insert(user),
    };
    match self.users_by_username.entry(username) {
      Entry::Occupied(_) => panic!("DinoparcUserUsername conflict"),
      Entry::Vacant(e) => e.insert(id),
    };
  }

  fn get_session_by_key(&self, key: &DinoparcSessionKey) -> Option<&MemSession> {
    self.sessions.get(key)
  }

  fn get_user_by_id(&self, id: &DinoparcUserId) -> Option<&MemUser> {
    self.users.get(id)
  }

  fn create_session(
    &mut self,
    time: Instant,
    username: DinoparcUsername,
    password: DinoparcPassword,
  ) -> Result<MemSession, Error> {
    let user = self
      .get_user_by_username(&username)
      .and_then(|u| if u.password == password { Some(u) } else { None });

    let user: MemUser = if let Some(user) = user {
      user.clone()
    } else {
      return Err(Error::InvalidCredentials);
    };

    {
      let sessions_by_user_id = &self.sessions_by_user_id;
      let sessions = &mut self.sessions;
      if let Some(old_session_key) = sessions_by_user_id.get(&user.id) {
        sessions.remove(old_session_key);
      }
    }

    let key = make_session_key();
    let created_at = time;
    let user_id = user.id;
    let session = MemSession {
      key: key.clone(),
      created_at,
      user_id,
    };

    self.sessions.insert(key.clone(), session.clone());
    self.sessions_by_user_id.insert(user_id, key);
    Ok(session)
  }
}

pub struct MemDinoparcClient<TyClock> {
  clock: TyClock,
  state: RwLock<HashMap<DinoparcServer, MemServer>>,
}

impl<TyClock> MemDinoparcClient<TyClock> {
  pub fn new(clock: TyClock) -> Self
  where
    TyClock: Clock,
  {
    let mut servers = HashMap::new();
    for server in DinoparcServer::iter() {
      servers.insert(server, MemServer::new());
    }
    Self {
      clock,
      state: RwLock::new(servers),
    }
  }

  pub fn create_user(
    &self,
    server: DinoparcServer,
    id: DinoparcUserId,
    username: DinoparcUsername,
    password: DinoparcPassword,
  ) {
    let mut state = self
      .state
      .write()
      .expect("failed to acquire write lock for dinoparc client state");
    state.get_mut(&server).unwrap().create_user(id, username, password)
  }
}

#[async_trait]
impl<TyClock> DinoparcClient for MemDinoparcClient<TyClock>
where
  TyClock: Clock,
{
  async fn get_preferred_exchange_with(&self, _server: DinoparcServer) -> [DinoparcUserId; 2] {
    todo!()
  }

  async fn create_session(&self, options: &DinoparcCredentials) -> Result<DinoparcSession, AnyError> {
    let mut state = self
      .state
      .write()
      .expect("failed to acquire write lock for dinoparc client state");
    let srv = state.get_mut(&options.server).unwrap();
    let session = srv.create_session(self.clock.now(), options.username.clone(), options.password.clone());
    match session {
      Ok(s) => {
        let user = srv.get_user_by_id(&s.user_id).unwrap();
        Ok(DinoparcSession {
          key: s.key,
          ctime: s.created_at,
          atime: s.created_at,
          user: ShortDinoparcUser {
            server: options.server,
            id: user.id,
            username: user.username.clone(),
          },
        })
      }
      Err(e) => Err(Box::new(e)),
    }
  }

  async fn test_session(
    &self,
    server: DinoparcServer,
    key: &DinoparcSessionKey,
  ) -> Result<Option<DinoparcSession>, AnyError> {
    let state = self
      .state
      .read()
      .expect("failed to acquire write lock for dinoparc client state");
    let srv = state.get(&server).unwrap();

    let session = srv.get_session_by_key(key);

    match session {
      Some(s) => {
        let user = srv.get_user_by_id(&s.user_id).unwrap();
        Ok(Some(DinoparcSession {
          key: s.key.clone(),
          ctime: s.created_at,
          atime: self.clock.now(),
          user: ShortDinoparcUser {
            server,
            id: user.id,
            username: user.username.clone(),
          },
        }))
      }
      None => Ok(None),
    }
  }

  async fn get_dinoz(
    &self,
    _session: &DinoparcSession,
    _id: DinoparcDinozId,
  ) -> Result<DinoparcDinozResponse, AnyError> {
    todo!()
  }

  async fn get_exchange_with(
    &self,
    _session: &DinoparcSession,
    _other_user: DinoparcUserId,
  ) -> Result<DinoparcExchangeWithResponse, AnyError> {
    todo!()
  }

  async fn get_inventory(&self, _session: &DinoparcSession) -> Result<DinoparcInventoryResponse, AnyError> {
    todo!()
  }

  async fn get_collection(&self, _session: &DinoparcSession) -> Result<DinoparcCollectionResponse, AnyError> {
    todo!()
  }
}

fn make_session_key() -> DinoparcSessionKey {
  use rand::seq::SliceRandom;

  const CHARS: &[u8] = b"abcdefghijklmnopqrstuvwxyz0123456789";
  let mut rng = rand::thread_rng();

  let key: String = std::iter::from_fn(|| CHARS.choose(&mut rng).copied())
    .map(char::from)
    .take(26)
    .collect();

  DinoparcSessionKey::from_str(&key).expect("invalid session key")
}

#[cfg(feature = "neon")]
impl<TyClock> neon::prelude::Finalize for MemDinoparcClient<TyClock> where TyClock: Clock {}
