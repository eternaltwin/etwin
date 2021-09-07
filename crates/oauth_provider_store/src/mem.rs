use async_trait::async_trait;
use etwin_core::auth::EtwinOauthAccessTokenKey;
use etwin_core::clock::Clock;
use etwin_core::core::Instant;
use etwin_core::oauth::{
  CreateStoredAccessTokenOptions, GetOauthAccessTokenOptions, GetOauthClientError, GetOauthClientOptions,
  OauthClientDisplayName, OauthClientId, OauthClientKey, OauthClientRef, OauthProviderStore, SimpleOauthClient,
  SimpleOauthClientWithSecret, StoredOauthAccessToken, UpsertSystemClientOptions,
};
use etwin_core::password::{PasswordHash, PasswordService};
use etwin_core::types::AnyError;
use etwin_core::user::UserIdRef;
use etwin_core::uuid::UuidGenerator;
use std::collections::HashMap;
use std::sync::RwLock;
use url::Url;

struct StoreState {
  clients: HashMap<OauthClientId, StoreClient>,
  client_keys: HashMap<OauthClientKey, OauthClientId>,
  access_tokens: HashMap<EtwinOauthAccessTokenKey, StoredOauthAccessToken>,
}

#[derive(Debug, Clone)]
struct StoreClient {
  id: OauthClientId,
  key: Option<OauthClientKey>,
  display_name: OauthClientDisplayName,
  app_uri: Url,
  callback_uri: Url,
  owner: Option<UserIdRef>,
  created_at: Instant,
  secret_hash: PasswordHash,
}

impl StoreState {
  fn new() -> Self {
    Self {
      clients: HashMap::new(),
      client_keys: HashMap::new(),
      access_tokens: HashMap::new(),
    }
  }

  pub(crate) fn upsert_system_client(
    &mut self,
    now: Instant,
    password: &impl PasswordService,
    uuid_generator: &impl UuidGenerator,
    options: &UpsertSystemClientOptions,
  ) -> Result<SimpleOauthClient, AnyError> {
    let client_id = self.client_keys.get(&options.key);
    let client = match client_id {
      None => None,
      Some(id) => self.clients.get_mut(id),
    };

    match client {
      None => {
        let secret_hash = password.hash(options.secret.clone());
        let store_client = StoreClient {
          id: OauthClientId::from_uuid(uuid_generator.next()),
          key: Some(options.key.clone()),
          display_name: options.display_name.clone(),
          app_uri: options.app_uri.clone(),
          callback_uri: options.callback_uri.clone(),
          owner: None,
          created_at: now,
          secret_hash,
        };
        self.client_keys.insert(options.key.clone(), store_client.id);
        self.clients.insert(store_client.id, store_client.clone());
        Ok(SimpleOauthClient {
          id: store_client.id,
          key: store_client.key,
          display_name: store_client.display_name,
          app_uri: store_client.app_uri,
          callback_uri: store_client.callback_uri,
          owner: store_client.owner,
        })
      }
      Some(store_client) => {
        if store_client.display_name != options.display_name {
          store_client.display_name = options.display_name.clone();
        }
        if store_client.app_uri != options.app_uri {
          store_client.app_uri = options.app_uri.clone();
        }
        if store_client.callback_uri != options.callback_uri {
          store_client.callback_uri = options.callback_uri.clone();
        }
        if !password.verify(store_client.secret_hash.clone(), options.secret.clone()) {
          let secret_hash = password.hash(options.secret.clone());
          store_client.secret_hash = secret_hash;
        }
        Ok(SimpleOauthClient {
          id: store_client.id,
          key: store_client.key.clone(),
          display_name: store_client.display_name.clone(),
          app_uri: store_client.app_uri.clone(),
          callback_uri: store_client.callback_uri.clone(),
          owner: store_client.owner,
        })
      }
    }
  }

  pub(crate) fn get_client(&self, options: &GetOauthClientOptions) -> Result<SimpleOauthClient, GetOauthClientError> {
    let id = match &options.r#ref {
      OauthClientRef::Id(r) => r.id,
      OauthClientRef::Key(r) => self
        .client_keys
        .get(&r.key)
        .cloned()
        .ok_or_else(|| GetOauthClientError::NotFound(options.r#ref.clone()))?,
    };
    let store_client = self
      .clients
      .get(&id)
      .ok_or_else(|| GetOauthClientError::NotFound(options.r#ref.clone()))?;
    Ok(SimpleOauthClient {
      id: store_client.id,
      key: store_client.key.clone(),
      display_name: store_client.display_name.clone(),
      app_uri: store_client.app_uri.clone(),
      callback_uri: store_client.callback_uri.clone(),
      owner: store_client.owner,
    })
  }

  pub(crate) fn get_client_with_secret(
    &self,
    options: &GetOauthClientOptions,
  ) -> Result<SimpleOauthClientWithSecret, AnyError> {
    let id = match &options.r#ref {
      OauthClientRef::Id(r) => r.id,
      OauthClientRef::Key(r) => self
        .client_keys
        .get(&r.key)
        .cloned()
        .ok_or_else(|| AnyError::from("NotFound"))?,
    };
    let store_client = self.clients.get(&id).ok_or_else(|| AnyError::from("NotFound"))?;
    Ok(SimpleOauthClientWithSecret {
      id: store_client.id,
      key: store_client.key.clone(),
      display_name: store_client.display_name.clone(),
      app_uri: store_client.app_uri.clone(),
      callback_uri: store_client.callback_uri.clone(),
      owner: store_client.owner,
      secret: store_client.secret_hash.clone(),
    })
  }

  pub(crate) fn create_access_token(
    &mut self,
    now: Instant,
    options: &CreateStoredAccessTokenOptions,
  ) -> Result<StoredOauthAccessToken, AnyError> {
    let token = StoredOauthAccessToken {
      key: options.key,
      created_at: now,
      accessed_at: now,
      expires_at: options.expiration_time,
      user: options.user,
      client: options.client,
    };
    self.access_tokens.insert(token.key, token.clone());
    Ok(token)
  }

  pub(crate) fn get_access_token(
    &mut self,
    now: Instant,
    options: &GetOauthAccessTokenOptions,
  ) -> Result<StoredOauthAccessToken, AnyError> {
    let token = self.access_tokens.get_mut(&options.key);
    let token = token.ok_or_else(|| AnyError::from("NotFound"))?;
    if options.touch_accessed_at {
      token.accessed_at = now;
    }
    Ok(token.clone())
  }
}

pub struct MemOauthProviderStore<TyClock, TyPassword, TyUuidGenerator>
where
  TyClock: Clock,
  TyPassword: PasswordService,
  TyUuidGenerator: UuidGenerator,
{
  clock: TyClock,
  password: TyPassword,
  uuid_generator: TyUuidGenerator,
  state: RwLock<StoreState>,
}

impl<TyClock, TyPassword, TyUuidGenerator> MemOauthProviderStore<TyClock, TyPassword, TyUuidGenerator>
where
  TyClock: Clock,
  TyPassword: PasswordService,
  TyUuidGenerator: UuidGenerator,
{
  pub fn new(clock: TyClock, password: TyPassword, uuid_generator: TyUuidGenerator) -> Self {
    Self {
      clock,
      password,
      uuid_generator,
      state: RwLock::new(StoreState::new()),
    }
  }
}

#[async_trait]
impl<TyClock, TyPassword, TyUuidGenerator> OauthProviderStore
  for MemOauthProviderStore<TyClock, TyPassword, TyUuidGenerator>
where
  TyClock: Clock,
  TyPassword: PasswordService,
  TyUuidGenerator: UuidGenerator,
{
  async fn upsert_system_client(&self, options: &UpsertSystemClientOptions) -> Result<SimpleOauthClient, AnyError> {
    let now = self.clock.now();
    let mut state = self.state.write().unwrap();
    state.upsert_system_client(now, &self.password, &self.uuid_generator, options)
  }

  async fn get_client(&self, options: &GetOauthClientOptions) -> Result<SimpleOauthClient, GetOauthClientError> {
    let state = self.state.read().unwrap();
    state.get_client(options)
  }

  async fn get_client_with_secret(
    &self,
    options: &GetOauthClientOptions,
  ) -> Result<SimpleOauthClientWithSecret, AnyError> {
    let state = self.state.read().unwrap();
    state.get_client_with_secret(options)
  }

  async fn create_access_token(
    &self,
    options: &CreateStoredAccessTokenOptions,
  ) -> Result<StoredOauthAccessToken, AnyError> {
    let now = self.clock.now();
    let mut state = self.state.write().unwrap();
    state.create_access_token(now, options)
  }

  async fn get_access_token(&self, options: &GetOauthAccessTokenOptions) -> Result<StoredOauthAccessToken, AnyError> {
    let now = self.clock.now();
    let mut state = self.state.write().unwrap();
    state.get_access_token(now, options)
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyPassword, TyUuidGenerator> neon::prelude::Finalize
  for MemOauthProviderStore<TyClock, TyPassword, TyUuidGenerator>
where
  TyClock: Clock,
  TyPassword: PasswordService,
  TyUuidGenerator: UuidGenerator,
{
}

#[cfg(test)]
mod test {
  use crate::mem::MemOauthProviderStore;
  use crate::test::TestApi;
  use chrono::{TimeZone, Utc};
  use etwin_core::clock::VirtualClock;
  use etwin_core::oauth::OauthProviderStore;
  use etwin_core::uuid::Uuid4Generator;
  use etwin_password::scrypt::ScryptPasswordService;
  use std::sync::Arc;

  fn make_test_api() -> TestApi<Arc<VirtualClock>, Arc<dyn OauthProviderStore>> {
    let clock = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));
    let password = Arc::new(ScryptPasswordService::recommended_for_tests());
    let uuid_generator = Arc::new(Uuid4Generator);
    let oauth_provider_store: Arc<dyn OauthProviderStore> =
      Arc::new(MemOauthProviderStore::new(Arc::clone(&clock), password, uuid_generator));

    TestApi {
      clock,
      oauth_provider_store,
    }
  }

  test_dinoparc_store!(|| make_test_api());
}
