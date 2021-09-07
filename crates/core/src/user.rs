use crate::core::{FinitePeriod, Instant};
use crate::email::EmailAddress;
use crate::password::PasswordHash;
use crate::types::AnyError;
use async_trait::async_trait;
use auto_impl::auto_impl;
use chrono::Duration;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{deserialize_explicit_option, deserialize_nested_option, Deserialize, Serialize};
use once_cell::sync::Lazy;
use std::error::Error;

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "User"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CompleteSimpleUser {
  pub id: UserId,
  pub created_at: Instant,
  pub display_name: UserDisplayNameVersions,
  pub is_administrator: bool,
  #[cfg_attr(feature = "_serde", serde(deserialize_with = "deserialize_explicit_option"))]
  pub username: Option<Username>,
  #[cfg_attr(feature = "_serde", serde(deserialize_with = "deserialize_explicit_option"))]
  pub email_address: Option<EmailAddress>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "User"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CompleteUser {
  pub id: UserId,
  pub display_name: UserDisplayNameVersions,
  // ...
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CreateUserOptions {
  pub display_name: UserDisplayName,
  pub email: Option<EmailAddress>,
  pub username: Option<Username>,
  pub password: Option<PasswordHash>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UpdateUserOptions {
  pub r#ref: UserIdRef,
  pub actor: UserIdRef,
  pub patch: UpdateUserPatch,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UpdateUserPatch {
  #[cfg_attr(feature = "_serde", serde(skip_serializing_if = "Option::is_none"))]
  pub display_name: Option<UserDisplayName>,
  #[cfg_attr(feature = "_serde", serde(skip_serializing_if = "Option::is_none"))]
  #[cfg_attr(feature = "_serde", serde(default, deserialize_with = "deserialize_nested_option"))]
  pub username: Option<Option<Username>>,
  #[cfg_attr(feature = "_serde", serde(skip_serializing_if = "Option::is_none"))]
  #[cfg_attr(feature = "_serde", serde(default, deserialize_with = "deserialize_nested_option"))]
  pub password: Option<Option<PasswordHash>>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize), serde(tag = "type"))]
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum UserFields {
  CompleteIfSelf { self_user_id: UserId },
  Complete,
  Default,
  Short,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetUserOptions {
  pub r#ref: UserRef,
  pub fields: UserFields,
  pub time: Option<Instant>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetShortUserOptions {
  pub r#ref: UserRef,
  pub time: Option<Instant>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize), serde(untagged))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum GetUserResult {
  Complete(CompleteSimpleUser),
  Default(SimpleUser),
  Short(ShortUser),
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "User"))]
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

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "User"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortUserWithPassword {
  pub id: UserId,
  pub display_name: UserDisplayNameVersions,
  pub password: Option<PasswordHash>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "User"))]
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

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "User"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct User {
  pub id: UserId,
  pub display_name: UserDisplayNameVersions,
  // pub links: ...,
  pub is_administrator: bool,
}

declare_new_string! {
  pub struct UserDisplayName(String);
  pub type ParseError = UserDisplayNameParseError;
  const PATTERN = r"^[\p{Letter}_ ()][\p{Letter}_ ()0-9]*$";
  const SQL_NAME = "user_display_name";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserDisplayNameVersion {
  pub value: UserDisplayName,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserDisplayNameVersions {
  pub current: UserDisplayNameVersion,
}

declare_new_uuid! {
  pub struct UserId(Uuid);
  pub type ParseError = UserIdParseError;
  const SQL_NAME = "user_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "User"))]
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserIdRef {
  pub id: UserId,
}

impl UserIdRef {
  pub const fn new(id: UserId) -> Self {
    Self { id }
  }
}

impl From<UserId> for UserIdRef {
  fn from(id: UserId) -> Self {
    Self::new(id)
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "User"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserUsernameRef {
  pub username: Username,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "User"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserEmailRef {
  pub email: EmailAddress,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize), serde(untagged))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum UserRef {
  Id(UserIdRef),
  Username(UserUsernameRef),
  Email(UserEmailRef),
}

declare_new_string! {
  pub struct Username(String);
  pub type ParseError = UsernameParseError;
  const PATTERN = "^[a-z_][a-z0-9_]{1,31}$";
  const SQL_NAME = "username";
}

pub static USERNAME_LOCK_DURATION: Lazy<Duration> = Lazy::new(|| Duration::days(7));
pub static USER_DISPLAY_NAME_LOCK_DURATION: Lazy<Duration> = Lazy::new(|| Duration::days(30));
pub static USER_PASSWORD_LOCK_DURATION: Lazy<Duration> = Lazy::new(|| Duration::minutes(10));

#[derive(Debug, thiserror::Error)]
pub enum UpdateUserError {
  #[error("Failed to find user to update for ref: {:?}", .0)]
  NotFound(UserIdRef),
  #[error("Failed to update user {:?}, display_name locked during {:?}, current time is {}", .0, .1, .2)]
  LockedDisplayName(UserIdRef, FinitePeriod, Instant),
  #[error("Failed to update user {:?}, username locked during {:?}, current time is {}", .0, .1, .2)]
  LockedUsername(UserIdRef, FinitePeriod, Instant),
  #[error("Failed to update user {:?}, password locked during {:?}, current time is {}", .0, .1, .2)]
  LockedPassword(UserIdRef, FinitePeriod, Instant),
  #[error(transparent)]
  Other(AnyError),
}

impl PartialEq for UpdateUserError {
  fn eq(&self, other: &Self) -> bool {
    match (self, other) {
      (UpdateUserError::NotFound(l), UpdateUserError::NotFound(r)) if l == r => true,
      (UpdateUserError::LockedDisplayName(l0, l1, l2), UpdateUserError::LockedDisplayName(r0, r1, r2))
        if (l0, l1, l2) == (r0, r1, r2) =>
      {
        true
      }
      (UpdateUserError::LockedUsername(l0, l1, l2), UpdateUserError::LockedUsername(r0, r1, r2))
        if (l0, l1, l2) == (r0, r1, r2) =>
      {
        true
      }
      (UpdateUserError::LockedPassword(l0, l1, l2), UpdateUserError::LockedPassword(r0, r1, r2))
        if (l0, l1, l2) == (r0, r1, r2) =>
      {
        true
      }
      _ => false,
    }
  }
}

impl UpdateUserError {
  pub fn other<E: 'static + Error + Send + Sync>(e: E) -> Self {
    Self::Other(Box::new(e))
  }
}

#[derive(Debug, thiserror::Error)]
pub enum DeleteUserError {
  #[error("Failed to find user to delete for ref: {:?}", .0)]
  NotFound(UserIdRef),
  #[error(transparent)]
  Other(AnyError),
}

impl PartialEq for DeleteUserError {
  fn eq(&self, other: &Self) -> bool {
    #[allow(clippy::match_like_matches_macro)]
    match (self, other) {
      (DeleteUserError::NotFound(l), DeleteUserError::NotFound(r)) if l == r => true,
      _ => false,
    }
  }
}

impl DeleteUserError {
  pub fn other<E: 'static + Error + Send + Sync>(e: E) -> Self {
    Self::Other(Box::new(e))
  }
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait UserStore: Send + Sync {
  async fn create_user(&self, options: &CreateUserOptions) -> Result<CompleteSimpleUser, AnyError>;

  async fn get_user(&self, options: &GetUserOptions) -> Result<Option<GetUserResult>, AnyError>;

  async fn get_short_user(&self, options: &GetShortUserOptions) -> Result<Option<ShortUser>, AnyError>;

  async fn get_user_with_password(&self, options: &GetUserOptions) -> Result<Option<ShortUserWithPassword>, AnyError>;

  async fn update_user(&self, options: &UpdateUserOptions) -> Result<CompleteSimpleUser, UpdateUserError>;

  async fn hard_delete_user(&self, user_ref: UserIdRef) -> Result<(), DeleteUserError>;
}

#[cfg(test)]
mod test {
  use crate::password::PasswordHash;
  use crate::user::{
    CompleteSimpleUser, GetUserResult, ShortUser, SimpleUser, UpdateUserPatch, UserDisplayNameVersion,
    UserDisplayNameVersions,
  };
  use chrono::{TimeZone, Utc};
  use std::fs;

  fn get_short_user_demurgos() -> ShortUser {
    ShortUser {
      id: "9f310484-963b-446b-af69-797feec6813f".parse().unwrap(),
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: "Demurgos".parse().unwrap(),
        },
      },
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_short_user_demurgos() {
    let s = fs::read_to_string("../../test-resources/core/user/short-user/demurgos/value.json").unwrap();
    let actual: ShortUser = serde_json::from_str(&s).unwrap();
    let expected = get_short_user_demurgos();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_short_user_demurgos() {
    let value = get_short_user_demurgos();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/user/short-user/demurgos/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_get_user_result_short() -> GetUserResult {
    GetUserResult::Short(ShortUser {
      id: "e9c17533-633e-4f60-be9e-72883ae0174a".parse().unwrap(),
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: "Alice".parse().unwrap(),
        },
      },
    })
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_get_user_result_short() {
    let s = fs::read_to_string("../../test-resources/core/user/get-user-result/short/value.json").unwrap();
    let actual: GetUserResult = serde_json::from_str(&s).unwrap();
    let expected = get_get_user_result_short();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_get_user_result_short() {
    let value = get_get_user_result_short();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/user/get-user-result/short/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_get_user_result_default() -> GetUserResult {
    GetUserResult::Default(SimpleUser {
      id: "28dbb0bf-0fdc-40fe-ae5a-dde193f9fea8".parse().unwrap(),
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: "Alice".parse().unwrap(),
        },
      },
      created_at: Utc.ymd(2021, 1, 15).and_hms_milli(14, 17, 14, 15),
      is_administrator: true,
    })
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_get_user_result_default() {
    let s = fs::read_to_string("../../test-resources/core/user/get-user-result/default/value.json").unwrap();
    let actual: GetUserResult = serde_json::from_str(&s).unwrap();
    let expected = get_get_user_result_default();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_get_user_result_default() {
    let value = get_get_user_result_default();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/user/get-user-result/default/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_get_user_result_complete() -> GetUserResult {
    GetUserResult::Complete(CompleteSimpleUser {
      id: "abeb9363-2035-4c20-9bb8-21edfb432cbf".parse().unwrap(),
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: "Alice".parse().unwrap(),
        },
      },
      created_at: Utc.ymd(2021, 1, 15).and_hms_milli(14, 17, 14, 15),
      is_administrator: true,
      username: Some("alice".parse().unwrap()),
      email_address: None,
    })
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_get_user_result_complete() {
    let s = fs::read_to_string("../../test-resources/core/user/get-user-result/complete/value.json").unwrap();
    let actual: GetUserResult = serde_json::from_str(&s).unwrap();
    let expected = get_get_user_result_complete();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_get_user_result_complete() {
    let value = get_get_user_result_complete();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/user/get-user-result/complete/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_update_user_patch_no_op() -> UpdateUserPatch {
    UpdateUserPatch {
      display_name: None,
      username: None,
      password: None,
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_update_user_patch_no_op() {
    let s = fs::read_to_string("../../test-resources/core/user/update-user-patch/no-op/value.json").unwrap();
    let actual: UpdateUserPatch = serde_json::from_str(&s).unwrap();
    let expected = get_update_user_patch_no_op();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_update_user_patch_no_op() {
    let value = get_update_user_patch_no_op();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/user/update-user-patch/no-op/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_update_user_patch_remove_username() -> UpdateUserPatch {
    UpdateUserPatch {
      display_name: None,
      username: Some(None),
      password: None,
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_update_user_patch_remove_username() {
    let s = fs::read_to_string("../../test-resources/core/user/update-user-patch/remove-username/value.json").unwrap();
    let actual: UpdateUserPatch = serde_json::from_str(&s).unwrap();
    let expected = get_update_user_patch_remove_username();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_update_user_patch_remove_username() {
    let value = get_update_user_patch_remove_username();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected =
      fs::read_to_string("../../test-resources/core/user/update-user-patch/remove-username/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_update_user_patch_set_all() -> UpdateUserPatch {
    let hash: Vec<u8> = hex::decode("736372797074000c0000000800000001c5ec1067adb434a19cb471dcfc13a8cec8c6e935ec7e14eda9f51a386924eeeb9fce39bb3d36f6101cc06189da63e0513a54553efbee9d2a058bafbda5231093c4ae5e9b3f87a2d002fa49ff75b868fd").unwrap();
    UpdateUserPatch {
      display_name: Some("Demurgos".parse().unwrap()),
      username: Some(Some("demurgos".parse().unwrap())),
      password: Some(Some(PasswordHash::from(&hash[..]))),
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_update_user_patch_set_all() {
    let s = fs::read_to_string("../../test-resources/core/user/update-user-patch/set-all/value.json").unwrap();
    let actual: UpdateUserPatch = serde_json::from_str(&s).unwrap();
    let expected = get_update_user_patch_set_all();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_update_user_patch_set_all() {
    let value = get_update_user_patch_set_all();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/user/update-user-patch/set-all/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_update_user_patch_set_username() -> UpdateUserPatch {
    UpdateUserPatch {
      display_name: None,
      username: Some(Some("demurgos".parse().unwrap())),
      password: None,
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_update_user_patch_set_username() {
    let s = fs::read_to_string("../../test-resources/core/user/update-user-patch/set-username/value.json").unwrap();
    let actual: UpdateUserPatch = serde_json::from_str(&s).unwrap();
    let expected = get_update_user_patch_set_username();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_update_user_patch_set_username() {
    let value = get_update_user_patch_set_username();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected =
      fs::read_to_string("../../test-resources/core/user/update-user-patch/set-username/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }
}
