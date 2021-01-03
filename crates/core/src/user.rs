use crate::core::Instant;
use crate::email::EmailAddress;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;
use regex::Regex;
#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};
use std::error::Error;
use uuid::Uuid;

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CompleteSimpleUser {
  pub id: UserId,
  pub display_name: UserDisplayNameVersions,
  pub is_administrator: bool,
  pub ctime: DateTime<Utc>,
  pub username: Option<Username>,
  pub email_address: Option<EmailAddress>,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CompleteUser {
  pub id: UserId,
  pub display_name: UserDisplayNameVersions,
  // ...
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CreateUserOptions {
  pub display_name: UserDisplayName,
  pub email: Option<EmailAddress>,
  pub username: Option<Username>,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetUserOptions {
  pub id: UserId,
  pub time: Option<Instant>,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum MaybeCompleteSimpleUser {
  Complete(CompleteSimpleUser),
  Default(SimpleUser),
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortUser {
  pub id: UserId,
  pub display_name: UserDisplayNameVersions,
}

impl From<SimpleUser> for ShortUser {
  fn from(user: SimpleUser) -> Self {
    Self {
      id: user.id,
      display_name: user.display_name,
    }
  }
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct SimpleUser {
  pub id: UserId,
  pub display_name: UserDisplayNameVersions,
  pub is_administrator: bool,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct User {
  pub id: UserId,
  pub display_name: UserDisplayNameVersions,
  // pub links: ...,
  pub is_administrator: bool,
}

#[cfg_attr(
  feature = "sqlx",
  derive(sqlx::Type),
  sqlx(transparent, rename = "user_display_name")
)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserDisplayName(String);

impl UserDisplayName {
  pub const PATTERN: Lazy<Regex> = Lazy::new(|| Regex::new(r"^[\p{Letter}_ ()][\p{Letter}_ ()0-9]*$").unwrap());

  pub fn from_str(raw: &str) -> Result<Self, ()> {
    if Self::PATTERN.is_match(raw) {
      Ok(Self(String::from(raw)))
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
pub struct UserDisplayNameVersion {
  pub value: UserDisplayName,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserDisplayNameVersions {
  pub current: UserDisplayNameVersion,
}

#[cfg_attr(feature = "sqlx", derive(sqlx::Type), sqlx(transparent, rename = "user_id"))]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserId(Uuid);

impl UserId {
  pub fn from_str(raw: &str) -> Result<Self, ()> {
    Uuid::parse_str(raw).map(Self).map_err(|_| ())
  }

  pub const fn from_uuid(inner: Uuid) -> Self {
    Self(inner)
  }
}

impl From<Uuid> for UserId {
  fn from(inner: Uuid) -> Self {
    Self::from_uuid(inner)
  }
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserIdRef {
  pub id: UserId,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Username(String);

impl Username {
  pub const PATTERN: Lazy<Regex> = Lazy::new(|| Regex::new("^[a-z_][a-z0-9_]{1,31}$").unwrap());

  pub fn from_str(raw: &str) -> Result<Self, ()> {
    if Self::PATTERN.is_match(raw) {
      Ok(Self(String::from(raw)))
    } else {
      Err(())
    }
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

#[async_trait]
pub trait UserStore: Send + Sync {
  async fn create_user(&self, options: &CreateUserOptions) -> Result<CompleteSimpleUser, Box<dyn Error>>;

  async fn get_user(&self, options: &GetUserOptions) -> Result<Option<SimpleUser>, Box<dyn Error>>;

  async fn get_complete_user(&self, options: &GetUserOptions) -> Result<Option<CompleteSimpleUser>, Box<dyn Error>>;
}
