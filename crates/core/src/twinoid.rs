use crate::core::Instant;
use async_trait::async_trait;
use auto_impl::auto_impl;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};
use once_cell::sync::Lazy;
use regex::Regex;
use std::error::Error;

declare_decimal_id! {
  pub struct TwinoidUserId(u32);
  pub type ParseError = TwinoidUserIdParseError;
  const BOUNDS = 1..1_000_000_000;
  const SQL_NAME = "twinoid_user_id";
}

declare_new_string! {
  pub struct TwinoidUserDisplayName(String);
  pub type ParseError = TwinoidUserDisplayNameParseError;
  const PATTERN = r"^.{1,100}$";
  const SQL_NAME = "twinoid_user_display_name";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "TwinoidUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortTwinoidUser {
  pub id: TwinoidUserId,
  pub display_name: TwinoidUserDisplayName,
}

impl From<ArchivedTwinoidUser> for ShortTwinoidUser {
  fn from(value: ArchivedTwinoidUser) -> Self {
    Self {
      id: value.id,
      display_name: value.display_name,
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "TwinoidUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TwinoidUserIdRef {
  pub id: TwinoidUserId,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "TwinoidUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ArchivedTwinoidUser {
  pub id: TwinoidUserId,
  pub archived_at: Instant,
  pub display_name: TwinoidUserDisplayName,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetTwinoidUserOptions {
  pub id: TwinoidUserId,
  pub time: Option<Instant>,
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait TwinoidStore: Send + Sync {
  async fn get_short_user(&self, options: &GetTwinoidUserOptions) -> Result<Option<ShortTwinoidUser>, Box<dyn Error>>;

  async fn get_user(&self, options: &GetTwinoidUserOptions) -> Result<Option<ArchivedTwinoidUser>, Box<dyn Error>>;

  async fn touch_short_user(&self, options: &ShortTwinoidUser) -> Result<ArchivedTwinoidUser, Box<dyn Error>>;
}
