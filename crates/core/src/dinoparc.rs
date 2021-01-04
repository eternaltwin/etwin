use crate::core::Instant;
use async_trait::async_trait;
use once_cell::sync::Lazy;
use regex::Regex;
#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};
#[cfg(feature = "sqlx")]
use sqlx::{database, postgres, Database, Postgres};
use std::error::Error;
use std::fmt;
use std::str::FromStr;

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetDinoparcUserOptions {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
  pub time: Option<Instant>,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum DinoparcServer {
  #[cfg_attr(feature = "serde", serde(rename = "dinoparc.com"))]
  DinoparcCom,
  #[cfg_attr(feature = "serde", serde(rename = "en.dinoparc.com"))]
  EnDinoparcCom,
  #[cfg_attr(feature = "serde", serde(rename = "sp.dinoparc.com"))]
  SpDinoparcCom,
}

impl DinoparcServer {
  pub const fn as_str(&self) -> &'static str {
    match self {
      Self::DinoparcCom => "dinoparc.com",
      Self::EnDinoparcCom => "en.dinoparc.com",
      Self::SpDinoparcCom => "sp.dinoparc.com",
    }
  }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcServerParseError;

impl fmt::Display for DinoparcServerParseError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "DinoparcServerParseError")
  }
}

impl Error for DinoparcServerParseError {}

impl FromStr for DinoparcServer {
  type Err = DinoparcServerParseError;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    match s {
      "dinoparc.com" => Ok(Self::DinoparcCom),
      "en.dinoparc.com" => Ok(Self::EnDinoparcCom),
      "sp.dinoparc.com" => Ok(Self::SpDinoparcCom),
      _ => Err(DinoparcServerParseError),
    }
  }
}

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for DinoparcServer {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("dinoparc_server")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info() || <&str as sqlx::Type<Postgres>>::compatible(ty)
  }
}

#[cfg(feature = "sqlx")]
impl<'r, Db: Database> sqlx::Decode<'r, Db> for DinoparcServer
where
  &'r str: sqlx::Decode<'r, Db>,
{
  fn decode(
    value: <Db as database::HasValueRef<'r>>::ValueRef,
  ) -> Result<DinoparcServer, Box<dyn Error + 'static + Send + Sync>> {
    let value: &str = <&str as sqlx::Decode<Db>>::decode(value)?;
    Ok(value.parse()?)
  }
}

#[cfg(feature = "sqlx")]
impl<'q, Db: Database> sqlx::Encode<'q, Db> for DinoparcServer
where
  &'q str: sqlx::Encode<'q, Db>,
{
  fn encode_by_ref(&self, buf: &mut <Db as database::HasArguments<'q>>::ArgumentBuffer) -> sqlx::encode::IsNull {
    self.as_str().encode(buf)
  }
}

#[cfg_attr(
  feature = "sqlx",
  derive(sqlx::Type),
  sqlx(transparent, rename = "hammerfest_user_id")
)]
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

#[cfg_attr(
  feature = "sqlx",
  derive(sqlx::Type),
  sqlx(transparent, rename = "hammerfest_user_id")
)]
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
#[cfg_attr(feature = "serde", serde(tag = "type", rename = "DinoparcUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortDinoparcUser {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
  pub username: DinoparcUsername,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcUserIdRef {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
}

#[async_trait]
pub trait DinoparcStore: Send + Sync {
  async fn get_short_user(&self, options: &GetDinoparcUserOptions)
    -> Result<Option<ShortDinoparcUser>, Box<dyn Error>>;

  async fn touch_short_user(&self, options: &ShortDinoparcUser) -> Result<ShortDinoparcUser, Box<dyn Error>>;
}
