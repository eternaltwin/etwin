use crate::core::Instant;
use crate::twinoid::TwinoidUserId;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};

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
