use crate::core::Instant;
use crate::email::EmailAddress;
use async_trait::async_trait;
use auto_impl::auto_impl;
use once_cell::sync::Lazy;
use regex::Regex;
#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};
use std::error::Error;
use uuid::Uuid;

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(tag = "type", rename = "User"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CompleteSimpleUser {
  pub id: UserId,
  pub created_at: Instant,
  pub display_name: UserDisplayNameVersions,
  pub is_administrator: bool,
  pub username: Option<Username>,
  pub email_address: Option<EmailAddress>,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(tag = "type", rename = "User"))]
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

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize), serde(tag = "type"))]
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum UserFields {
  CompleteIfSelf { self_user_id: UserId },
  Complete,
  Default,
  Short,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetUserOptions {
  pub r#ref: UserRef,
  pub fields: UserFields,
  pub time: Option<Instant>,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetShortUserOptions {
  pub r#ref: UserRef,
  pub time: Option<Instant>,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize), serde(untagged))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum GetUserResult {
  Complete(CompleteSimpleUser),
  Default(SimpleUser),
  Short(ShortUser),
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(tag = "type", rename = "User"))]
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

impl From<CompleteSimpleUser> for ShortUser {
  fn from(user: CompleteSimpleUser) -> Self {
    Self {
      id: user.id,
      display_name: user.display_name,
    }
  }
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(tag = "type", rename = "User"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct SimpleUser {
  pub id: UserId,
  pub created_at: Instant,
  pub display_name: UserDisplayNameVersions,
  pub is_administrator: bool,
}

impl From<CompleteSimpleUser> for SimpleUser {
  fn from(user: CompleteSimpleUser) -> Self {
    Self {
      id: user.id,
      created_at: user.created_at,
      display_name: user.display_name,
      is_administrator: user.is_administrator,
    }
  }
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(tag = "type", rename = "User"))]
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
#[cfg_attr(feature = "serde", serde(tag = "type", rename = "User"))]
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserIdRef {
  pub id: UserId,
}

impl UserIdRef {
  pub const fn new(id: UserId) -> Self {
    Self { id }
  }
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(tag = "type", rename = "User"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserUsernameRef {
  pub username: Username,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(tag = "type", rename = "User"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserEmailRef {
  pub email: EmailAddress,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize), serde(untagged))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum UserRef {
  Id(UserIdRef),
  Username(UserUsernameRef),
  Email(UserEmailRef),
}

#[cfg_attr(feature = "sqlx", derive(sqlx::Type), sqlx(transparent, rename = "username"))]
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
#[auto_impl(&, Arc)]
pub trait UserStore: Send + Sync {
  async fn create_user(&self, options: &CreateUserOptions) -> Result<CompleteSimpleUser, Box<dyn Error>>;

  async fn get_user(&self, options: &GetUserOptions) -> Result<Option<GetUserResult>, Box<dyn Error>>;

  async fn get_short_user(&self, options: &GetShortUserOptions) -> Result<Option<ShortUser>, Box<dyn Error>>;

  async fn hard_delete_user_by_id(&self, user_ref: UserIdRef) -> Result<(), Box<dyn Error>>;
}

#[cfg(test)]
mod test {
  use crate::user::{
    CompleteSimpleUser, GetUserResult, ShortUser, SimpleUser, UserDisplayName, UserDisplayNameVersion,
    UserDisplayNameVersions, UserId, Username,
  };
  use chrono::{TimeZone, Utc};
  use std::fs;

  fn get_short_user_demurgos() -> ShortUser {
    ShortUser {
      id: UserId::from_str("9f310484-963b-446b-af69-797feec6813f").unwrap(),
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: UserDisplayName::from_str("Demurgos").unwrap(),
        },
      },
    }
  }

  #[cfg(feature = "serde")]
  #[test]
  fn read_short_user_demurgos() {
    let s = fs::read_to_string("../../test-resources/core/user/short-user/demurgos/value.json").unwrap();
    let actual: ShortUser = serde_json::from_str(&s).unwrap();
    let expected = get_short_user_demurgos();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "serde")]
  #[test]
  fn write_short_user_demurgos() {
    let value = get_short_user_demurgos();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/user/short-user/demurgos/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_get_user_result_short() -> GetUserResult {
    GetUserResult::Short(ShortUser {
      id: UserId::from_str("e9c17533-633e-4f60-be9e-72883ae0174a").unwrap(),
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: UserDisplayName::from_str("Alice").unwrap(),
        },
      },
    })
  }

  #[cfg(feature = "serde")]
  #[test]
  fn read_get_user_result_short() {
    let s = fs::read_to_string("../../test-resources/core/user/get-user-result/short/value.json").unwrap();
    let actual: GetUserResult = serde_json::from_str(&s).unwrap();
    let expected = get_get_user_result_short();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "serde")]
  #[test]
  fn write_get_user_result_short() {
    let value = get_get_user_result_short();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/user/get-user-result/short/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_get_user_result_default() -> GetUserResult {
    GetUserResult::Default(SimpleUser {
      id: UserId::from_str("28dbb0bf-0fdc-40fe-ae5a-dde193f9fea8").unwrap(),
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: UserDisplayName::from_str("Alice").unwrap(),
        },
      },
      created_at: Utc.ymd(2021, 1, 15).and_hms_milli(14, 17, 14, 15),
      is_administrator: true,
    })
  }

  #[cfg(feature = "serde")]
  #[test]
  #[ignore]
  fn read_get_user_result_default() {
    let s = fs::read_to_string("../../test-resources/core/user/get-user-result/default/value.json").unwrap();
    let actual: GetUserResult = serde_json::from_str(&s).unwrap();
    let expected = get_get_user_result_default();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "serde")]
  #[test]
  fn write_get_user_result_default() {
    let value = get_get_user_result_default();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/user/get-user-result/default/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_get_user_result_complete() -> GetUserResult {
    GetUserResult::Complete(CompleteSimpleUser {
      id: UserId::from_str("abeb9363-2035-4c20-9bb8-21edfb432cbf").unwrap(),
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: UserDisplayName::from_str("Alice").unwrap(),
        },
      },
      created_at: Utc.ymd(2021, 1, 15).and_hms_milli(14, 17, 14, 15),
      is_administrator: true,
      username: Some(Username::from_str("alice").unwrap()),
      email_address: None,
    })
  }

  #[cfg(feature = "serde")]
  #[test]
  fn read_get_user_result_complete() {
    let s = fs::read_to_string("../../test-resources/core/user/get-user-result/complete/value.json").unwrap();
    let actual: GetUserResult = serde_json::from_str(&s).unwrap();
    let expected = get_get_user_result_complete();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "serde")]
  #[test]
  fn write_get_user_result_complete() {
    let value = get_get_user_result_complete();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/user/get-user-result/complete/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }
}
