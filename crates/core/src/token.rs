use crate::core::Instant;
use crate::dinoparc::{DinoparcServer, DinoparcSessionKey, DinoparcUserIdRef, StoredDinoparcSession};
use crate::hammerfest::{HammerfestServer, HammerfestSessionKey, HammerfestUserIdRef, StoredHammerfestSession};
use crate::oauth::{RfcOauthAccessTokenKey, RfcOauthRefreshTokenKey, TwinoidAccessToken, TwinoidRefreshToken};
use crate::twinoid::{TwinoidUserId, TwinoidUserIdRef};
use async_trait::async_trait;
use auto_impl::auto_impl;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};
use std::error::Error;

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TouchOauthTokenOptions {
  pub access_token: RfcOauthAccessTokenKey,
  pub refresh_token: RfcOauthRefreshTokenKey,
  pub expiration_time: Instant,
  pub twinoid_user_id: TwinoidUserId,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TwinoidOauth {
  pub access_token: Option<TwinoidAccessToken>,
  pub refresh_token: TwinoidRefreshToken,
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait TokenStore: Send + Sync {
  async fn touch_twinoid_oauth(&self, options: &TouchOauthTokenOptions) -> Result<(), Box<dyn Error>>;
  async fn revoke_twinoid_access_token(&self, options: &RfcOauthAccessTokenKey) -> Result<(), Box<dyn Error>>;
  async fn revoke_twinoid_refresh_token(&self, options: &RfcOauthRefreshTokenKey) -> Result<(), Box<dyn Error>>;
  async fn get_twinoid_oauth(&self, options: TwinoidUserIdRef) -> Result<Option<TwinoidOauth>, Box<dyn Error>>;
  async fn touch_dinoparc(
    &self,
    user: DinoparcUserIdRef,
    key: &DinoparcSessionKey,
  ) -> Result<StoredDinoparcSession, Box<dyn Error>>;
  async fn revoke_dinoparc(&self, server: DinoparcServer, key: &DinoparcSessionKey) -> Result<(), Box<dyn Error>>;
  async fn get_dinoparc(&self, user: DinoparcUserIdRef) -> Result<Option<StoredDinoparcSession>, Box<dyn Error>>;
  async fn touch_hammerfest(
    &self,
    user: HammerfestUserIdRef,
    key: &HammerfestSessionKey,
  ) -> Result<StoredHammerfestSession, Box<dyn Error>>;
  async fn revoke_hammerfest(&self, server: HammerfestServer, key: &HammerfestSessionKey)
    -> Result<(), Box<dyn Error>>;
  async fn get_hammerfest(&self, user: HammerfestUserIdRef) -> Result<Option<StoredHammerfestSession>, Box<dyn Error>>;
}
