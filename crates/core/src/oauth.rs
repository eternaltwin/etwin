use crate::auth::EtwinOauthAccessTokenKey;
use crate::core::Instant;
use crate::password::{Password, PasswordHash};
use crate::twinoid::TwinoidUserId;
use crate::types::EtwinError;
use crate::user::{ShortUser, UserIdRef};
use async_trait::async_trait;
use auto_impl::auto_impl;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};
use std::str::FromStr;
use thiserror::Error;
use url::Url;

declare_new_uuid! {
  pub struct OauthClientId(Uuid);
  pub type ParseError = OauthClientIdParseError;
  const SQL_NAME = "oauth_client_id";
}

declare_new_string! {
  pub struct OauthClientKey(String);
  pub type ParseError = OauthClientKeyParseError;
  const PATTERN = r"^[a-z_][a-z0-9_]{1,31}@clients$";
  const SQL_NAME = "oauth_client_key";
}

declare_new_string! {
  pub struct RfcOauthAccessTokenKey(String);
  pub type ParseError = RfcOauthAccessTokenKeyParseError;
  const PATTERN = r"^.+$";
  const SQL_NAME = "rfc_oauth_access_token_key";
}

declare_new_string! {
  pub struct RfcOauthRefreshTokenKey(String);
  pub type ParseError = RfcOauthRefreshTokenKeyParseError;
  const PATTERN = r"^.+$";
  const SQL_NAME = "rfc_oauth_refresh_token_key";
}

declare_new_enum!(
  pub enum RfcOauthResponseType {
    #[str("code")]
    Code,
    #[str("token")]
    Token,
  }
  pub type ParseError = RfcOauthResponseTypeParseError;
);

declare_new_enum!(
  pub enum RfcOauthGrantType {
    #[str("authorization_code")]
    AuthorizationCode,
  }
  pub type ParseError = RfcOauthGrantTypeParseError;
);

declare_new_enum!(
  pub enum RfcOauthTokenType {
    // TODO: Case-insensitive deserialization
    #[str("Bearer")]
    Bearer,
  }
  pub type ParseError = RfcOauthTokenTypeParseError;
);

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TwinoidAccessToken {
  pub key: RfcOauthAccessTokenKey,
  #[cfg_attr(feature = "_serde", serde(rename = "ctime"))]
  pub created_at: Instant,
  #[cfg_attr(feature = "_serde", serde(rename = "atime"))]
  pub accessed_at: Instant,
  #[cfg_attr(feature = "_serde", serde(rename = "expiration_time"))]
  pub expires_at: Instant,
  pub twinoid_user_id: TwinoidUserId,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TwinoidRefreshToken {
  pub key: RfcOauthRefreshTokenKey,
  #[cfg_attr(feature = "_serde", serde(rename = "ctime"))]
  pub created_at: Instant,
  #[cfg_attr(feature = "_serde", serde(rename = "atime"))]
  pub accessed_at: Instant,
  pub twinoid_user_id: TwinoidUserId,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct StoredOauthAccessToken {
  pub key: EtwinOauthAccessTokenKey,
  #[cfg_attr(feature = "_serde", serde(rename = "ctime"))]
  pub created_at: Instant,
  #[cfg_attr(feature = "_serde", serde(rename = "atime"))]
  pub accessed_at: Instant,
  #[cfg_attr(feature = "_serde", serde(rename = "expiration_time"))]
  pub expires_at: Instant,
  pub user: UserIdRef,
  pub client: OauthClientIdRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct OauthAccessToken {
  pub token_type: RfcOauthTokenType,
  pub access_token: EtwinOauthAccessTokenKey,
  pub expires_in: i64,
  #[cfg_attr(feature = "_serde", serde(skip_serializing_if = "Option::is_none"))]
  pub refresh_token: Option<RfcOauthRefreshTokenKey>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "OauthClient"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortOauthClient {
  pub id: OauthClientId,
  pub key: Option<OauthClientKey>,
  pub display_name: OauthClientDisplayName,
}

impl From<SimpleOauthClient> for ShortOauthClient {
  fn from(client: SimpleOauthClient) -> Self {
    Self {
      id: client.id,
      key: client.key,
      display_name: client.display_name,
    }
  }
}

declare_new_string! {
  pub struct OauthClientDisplayName(String);
  pub type ParseError = OauthClientDisplayNameParseError;
  const PATTERN = r"^[A-Za-z_ ()-]{2,32}$";
  const SQL_NAME = "oauth_client_display_name";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "OauthClient"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct OauthClient {
  pub id: OauthClientId,
  pub key: Option<OauthClientKey>,
  pub display_name: OauthClientDisplayName,
  pub app_uri: Url,
  pub callback_uri: Url,
  pub owner: Option<ShortUser>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "OauthClient"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct SimpleOauthClient {
  pub id: OauthClientId,
  pub key: Option<OauthClientKey>,
  pub display_name: OauthClientDisplayName,
  pub app_uri: Url,
  pub callback_uri: Url,
  pub owner: Option<UserIdRef>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "OauthClient"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct SimpleOauthClientWithSecret {
  pub id: OauthClientId,
  pub key: Option<OauthClientKey>,
  pub display_name: OauthClientDisplayName,
  pub app_uri: Url,
  pub callback_uri: Url,
  pub owner: Option<UserIdRef>,
  pub secret: PasswordHash,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UpsertSystemClientOptions {
  pub key: OauthClientKey,
  pub display_name: OauthClientDisplayName,
  pub app_uri: Url,
  pub callback_uri: Url,
  pub secret: Password,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct OauthClientIdRef {
  pub id: OauthClientId,
}

impl From<OauthClientId> for OauthClientIdRef {
  fn from(id: OauthClientId) -> Self {
    Self { id }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct OauthClientKeyRef {
  pub key: OauthClientKey,
}

impl From<OauthClientKey> for OauthClientKeyRef {
  fn from(key: OauthClientKey) -> Self {
    Self { key }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum OauthClientRef {
  Id(OauthClientIdRef),
  Key(OauthClientKeyRef),
}

impl FromStr for OauthClientRef {
  type Err = ();

  fn from_str(input: &str) -> Result<Self, Self::Err> {
    if let Ok(client_key) = OauthClientKey::from_str(input) {
      Ok(OauthClientRef::Key(client_key.into()))
    } else if let Ok(id) = OauthClientId::from_str(input) {
      Ok(OauthClientRef::Id(id.into()))
    } else {
      Err(())
    }
  }
}

declare_new_string! {
  pub struct EtwinOauthScopesString(String);
  pub type ParseError = EtwinOauthScopesStringParseError;
  const PATTERN = r"^.{0,100}$";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct EtwinOauthScopes {
  pub base: bool,
}

impl EtwinOauthScopes {
  pub fn strings(&self) -> Vec<String> {
    if self.base {
      vec!["base".to_string()]
    } else {
      Vec::new()
    }
  }
}

impl Default for EtwinOauthScopes {
  fn default() -> Self {
    Self { base: true }
  }
}

impl FromStr for EtwinOauthScopes {
  type Err = ();

  fn from_str(input: &str) -> Result<Self, Self::Err> {
    let scopes = input.split(' ').map(str::trim).filter(|s| !s.is_empty());
    let parsed = EtwinOauthScopes::default();
    for scope in scopes {
      match scope {
        "base" => debug_assert!(parsed.base),
        _ => return Err(()), // Unknown scope
      }
    }
    Ok(parsed)
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetOauthClientOptions {
  pub r#ref: OauthClientRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct VerifyClientSecretOptions {
  pub r#ref: OauthClientRef,
  pub secret: Password,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CreateStoredAccessTokenOptions {
  pub key: EtwinOauthAccessTokenKey,
  pub ctime: Instant,
  pub expiration_time: Instant,
  pub user: UserIdRef,
  pub client: OauthClientIdRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetOauthAccessTokenOptions {
  pub key: EtwinOauthAccessTokenKey,
  pub touch_accessed_at: bool,
}

#[derive(Error, Debug)]
pub enum GetOauthClientError {
  #[error("oauth client not found: {0:?}")]
  NotFound(OauthClientRef),
  #[error(transparent)]
  Other(EtwinError),
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait OauthProviderStore: Send + Sync {
  async fn upsert_system_client(&self, options: &UpsertSystemClientOptions) -> Result<SimpleOauthClient, EtwinError>;

  async fn get_client(&self, options: &GetOauthClientOptions) -> Result<SimpleOauthClient, GetOauthClientError>;

  async fn get_client_with_secret(
    &self,
    options: &GetOauthClientOptions,
  ) -> Result<SimpleOauthClientWithSecret, EtwinError>;

  async fn create_access_token(
    &self,
    options: &CreateStoredAccessTokenOptions,
  ) -> Result<StoredOauthAccessToken, EtwinError>;

  async fn get_access_token(&self, options: &GetOauthAccessTokenOptions) -> Result<StoredOauthAccessToken, EtwinError>;
}
