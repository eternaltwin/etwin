use once_cell::sync::Lazy;
use regex::Regex;
#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

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

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(tag = "type", rename = "DinoparcUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortTwinoidUser {
  pub id: TwinoidUserId,
  pub display_name: TwinoidUserDisplayName,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(tag = "type", rename = "DinoparcUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TwinoidUserIdRef {
  pub id: TwinoidUserId,
}
