use crate::types::AnyError;
use async_trait::async_trait;
use auto_impl::auto_impl;
use enum_iterator::IntoEnumIterator;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, IntoEnumIterator)]
pub enum PopotamoServer {
  #[cfg_attr(feature = "_serde", serde(rename = "popotamo.com"))]
  PopotamoCom,
  // #[cfg_attr(feature = "_serde", serde(rename = "en.popotamo.com"))]
  // EnPopotamoCom,
}

declare_decimal_id! {
  pub struct PopotamoUserId(u32);
  pub type ParseError = PopotamoUserIdParseError;
  const BOUNDS = 0..1_000_000_000;
  const SQL_NAME = "popotamo_user_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "PopotamoUser"))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PopotamoUserIdRef {
  pub server: PopotamoServer,
  pub id: PopotamoUserId,
}

declare_new_string! {
  pub struct PopotamoUsername(String);
  pub type ParseError = PopotamoUsernameParseError;
  // TODO: Pattern
  const PATTERN = r"^[0-9A-Za-z_-]{1,8}$";
  const SQL_NAME = "popotamo_username";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PopotamoPassword(String);

impl PopotamoPassword {
  pub fn new(raw: String) -> Self {
    Self(raw)
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PopotamoCredentials {
  pub username: PopotamoUsername,
  pub password: PopotamoPassword,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "PopotamoUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortPopotamoUser {
  pub server: PopotamoServer,
  pub id: PopotamoUserId,
  pub username: PopotamoUsername,
}

impl ShortPopotamoUser {
  pub const fn as_ref(&self) -> PopotamoUserIdRef {
    PopotamoUserIdRef {
      server: self.server,
      id: self.id,
    }
  }
}

/// Data in the top right for logged-in users
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PopotamoSessionUser {
  pub user: ShortPopotamoUser,
  // pub rewards: ...,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PopotamoProfileResponse {
  pub session_user: Option<PopotamoSessionUser>,
  pub profile: PopotamoProfile,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PopotamoProfile {
  pub user: ShortPopotamoUser,
  // pub rewards: ...,
  // pub items: ...,
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait PopotamoClient: Send + Sync {
  async fn get_profile(&self, id: PopotamoUserIdRef) -> Result<PopotamoProfileResponse, AnyError>;
}
