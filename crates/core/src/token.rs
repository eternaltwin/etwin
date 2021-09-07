use crate::core::Instant;
use crate::dinoparc::{DinoparcServer, DinoparcSessionKey, DinoparcUserIdRef, StoredDinoparcSession};
use crate::hammerfest::{HammerfestServer, HammerfestSessionKey, HammerfestUserIdRef, StoredHammerfestSession};
use crate::oauth::{RfcOauthAccessTokenKey, RfcOauthRefreshTokenKey, TwinoidAccessToken, TwinoidRefreshToken};
use crate::twinoid::{TwinoidUserId, TwinoidUserIdRef};
use crate::types::AnyError;
use async_trait::async_trait;
use auto_impl::auto_impl;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TouchOauthTokenOptions {
  pub access_token: RfcOauthAccessTokenKey,
  pub refresh_token: RfcOauthRefreshTokenKey,
  pub expiration_time: Instant,
  pub twinoid_user_id: TwinoidUserId,
}

/// Current Twinoid OAuth tokens
///
/// If the refresh token is revoked but an access token still exists, may
/// return `TwinoidOauth {access_token: Some, refresh_token: None}`.
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TwinoidOauth {
  pub access_token: Option<TwinoidAccessToken>,
  pub refresh_token: Option<TwinoidRefreshToken>,
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait TokenStore: Send + Sync {
  async fn touch_twinoid_oauth(&self, options: &TouchOauthTokenOptions) -> Result<(), AnyError>;
  async fn revoke_twinoid_access_token(&self, options: &RfcOauthAccessTokenKey) -> Result<(), AnyError>;
  async fn revoke_twinoid_refresh_token(&self, options: &RfcOauthRefreshTokenKey) -> Result<(), AnyError>;
  async fn get_twinoid_oauth(&self, options: TwinoidUserIdRef) -> Result<TwinoidOauth, AnyError>;
  async fn touch_dinoparc(
    &self,
    user: DinoparcUserIdRef,
    key: &DinoparcSessionKey,
  ) -> Result<StoredDinoparcSession, AnyError>;
  async fn revoke_dinoparc(&self, server: DinoparcServer, key: &DinoparcSessionKey) -> Result<(), AnyError>;
  async fn get_dinoparc(&self, user: DinoparcUserIdRef) -> Result<Option<StoredDinoparcSession>, AnyError>;
  async fn touch_hammerfest(
    &self,
    user: HammerfestUserIdRef,
    key: &HammerfestSessionKey,
  ) -> Result<StoredHammerfestSession, AnyError>;
  async fn revoke_hammerfest(&self, server: HammerfestServer, key: &HammerfestSessionKey) -> Result<(), AnyError>;
  async fn get_hammerfest(&self, user: HammerfestUserIdRef) -> Result<Option<StoredHammerfestSession>, AnyError>;
}
