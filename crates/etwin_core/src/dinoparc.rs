use crate::core::Instant;
use async_trait::async_trait;
use once_cell::sync::Lazy;
use regex::Regex;
use std::error::Error;
#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetDinoparcUserOptions {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
  pub time: Option<Instant>,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum DinoparcServer {
  #[cfg_attr(feature = "serde", serde(rename = "dinoparc.com"))]
  DinoparcCom,
  #[cfg_attr(feature = "serde", serde(rename = "en.dinoparc.com"))]
  EnDinoparcCom,
  #[cfg_attr(feature = "serde", serde(rename = "sp.dinoparc.com"))]
  SpDinoparcCom,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcUserId(String);

impl DinoparcUserId {
  pub const PATTERN: Lazy<Regex> = Lazy::new(|| Regex::new(r"^[1-9][0-9]{0,8}$").unwrap());

  pub fn try_from_string(raw: String) -> Result<Self, ()> {
    if Self::PATTERN.is_match(&raw) {
      Ok(Self(raw))
    } else {
      Err(())
    }
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcUsername(String);

impl DinoparcUsername {
  pub const PATTERN: Lazy<Regex> = Lazy::new(|| Regex::new(r"^[0-9A-Za-z-]{1,14}$").unwrap());

  pub fn try_from_string(raw: String) -> Result<Self, ()> {
    if Self::PATTERN.is_match(&raw) {
      Ok(Self(raw))
    } else {
      Err(())
    }
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
pub struct TaggedShortDinoparcUser {
  #[allow(unused)]
  r#type: String,
  #[allow(unused)]
  #[cfg_attr(feature = "serde", serde(flatten))]
  inner: ShortDinoparcUser,
}

impl TaggedShortDinoparcUser {
  pub fn new(inner: ShortDinoparcUser) -> Self {
    Self {
      r#type: String::from("DinoparcUser"),
      inner
    }
  }
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortDinoparcUser {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
  pub username: DinoparcUsername,
}

#[async_trait]
pub trait DinoparcStore: Send + Sync {
  async fn get_short_user(&self, options: &GetDinoparcUserOptions) -> Result<Option<ShortDinoparcUser>, Box<dyn Error>>;

  async fn touch_short_user(&self, options: &ShortDinoparcUser) -> Result<ShortDinoparcUser, Box<dyn Error>>;
}
