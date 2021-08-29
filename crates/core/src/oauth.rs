use crate::core::Instant;
use crate::password::{Password, PasswordHash};
use crate::twinoid::TwinoidUserId;
use crate::types::EtwinError;
use crate::user::{ShortUser, UserIdRef};
use async_trait::async_trait;
use auto_impl::auto_impl;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};
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
  pub key: RfcOauthAccessTokenKey,
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
  pub key: RfcOauthAccessTokenKey,
  pub ctime: Instant,
  pub expiration_time: Instant,
  pub user: UserIdRef,
  pub client: OauthClientIdRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetOauthAccessTokenOptions {
  pub key: RfcOauthAccessTokenKey,
  pub touch_accessed_at: bool,
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait OauthProviderStore: Send + Sync {
  async fn upsert_system_client(&self, options: &UpsertSystemClientOptions) -> Result<SimpleOauthClient, EtwinError>;

  async fn get_client(&self, options: &GetOauthClientOptions) -> Result<SimpleOauthClient, EtwinError>;

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
