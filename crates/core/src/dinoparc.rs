use crate::core::Instant;
use async_trait::async_trait;
use auto_impl::auto_impl;
use enum_iterator::IntoEnumIterator;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};
use once_cell::sync::Lazy;
use regex::Regex;
#[cfg(feature = "sqlx")]
use sqlx::{database, postgres, Database, Postgres};
use std::error::Error;
use std::fmt;
use std::iter::FusedIterator;
use std::str::FromStr;

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetDinoparcUserOptions {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
  pub time: Option<Instant>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, IntoEnumIterator)]
pub enum DinoparcServer {
  #[cfg_attr(feature = "_serde", serde(rename = "dinoparc.com"))]
  DinoparcCom,
  #[cfg_attr(feature = "_serde", serde(rename = "en.dinoparc.com"))]
  EnDinoparcCom,
  #[cfg_attr(feature = "_serde", serde(rename = "sp.dinoparc.com"))]
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

  pub fn iter() -> impl Iterator<Item = Self> + ExactSizeIterator + FusedIterator + Copy {
    Self::into_enum_iter()
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

declare_decimal_id! {
  pub struct DinoparcUserId(u32);
  pub type ParseError = DinoparcUserIdParseError;
  const BOUNDS = 1..1_000_000_000;
  const SQL_NAME = "dinoparc_user_id";
}

declare_new_string! {
  pub struct DinoparcUsername(String);
  pub type ParseError = DinoparcUsernameParseError;
  const PATTERN = r"^[0-9A-Za-z-]{1,14}$";
  const SQL_NAME = "dinoparc_username";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcPassword(String);

impl DinoparcPassword {
  pub fn new(raw: String) -> Self {
    Self(raw)
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcCredentials {
  pub server: DinoparcServer,
  pub username: DinoparcUsername,
  pub password: DinoparcPassword,
}

declare_new_string! {
  /// A Dinoparc session key.
  ///
  /// It correspond to the value of the `sid` cookie.
  ///
  /// - `oetxjSBD3FEqDlLLNffGUY0NLKMmDDjv`
  /// - `pJ5zOeaKuw0mjGB9xdGVJuRdpCASjmBl`
  /// - `LlkSCMQW5fESPSOUVt3FMrqBwXwAhwzj`
  pub struct DinoparcSessionKey(String);
  pub type ParseError = DinoparcSessionKeyParseError;
  const PATTERN = r"^[0-9a-zA-Z]{32}$";
  const SQL_NAME = "dinoparc_session_key";
}

declare_new_string! {
  pub struct DinoparcMachineId(String);
  pub type ParseError = DinoparcMachineIdParseError;
  const PATTERN = r"^[0-9a-zA-Z]{32}$";
  const SQL_NAME = "dinoparc_machine_id";
}

impl DinoparcMachineId {
  pub const LENGTH: usize = 32;
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcSession {
  pub ctime: Instant,
  pub atime: Instant,
  pub key: DinoparcSessionKey,
  pub user: ShortDinoparcUser,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinoparcUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortDinoparcUser {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
  pub username: DinoparcUsername,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinoparcUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ArchivedDinoparcUser {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
  pub username: DinoparcUsername,
  pub archived_at: Instant,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinoparcUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcUserIdRef {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
}

declare_decimal_id! {
  pub struct DinoparcDinozId(u32);
  pub type ParseError = DinoparcDinozIdParseError;
  const BOUNDS = 1..1_000_000_000;
  const SQL_NAME = "dinoparc_dinoz_id";
}

declare_new_string! {
  pub struct DinoparcDinozName(String);
  pub type ParseError = DinoparcDinozNameParseError;
  const PATTERN = r"^[0-9A-Za-z-_é]{1,15}$";
  const SQL_NAME = "dinoparc_dinoz_name";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinoparcDinoz"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcDinoz {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait DinoparcClient: Send + Sync {
  async fn create_session(&self, options: &DinoparcCredentials) -> Result<DinoparcSession, Box<dyn Error>>;

  async fn test_session(
    &self,
    server: DinoparcServer,
    key: &DinoparcSessionKey,
  ) -> Result<Option<DinoparcSession>, Box<dyn Error>>;

  async fn get_dinoz(
    &self,
    session: &DinoparcSession,
    id: DinoparcDinozId,
  ) -> Result<Option<DinoparcDinoz>, Box<dyn Error>>;
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait DinoparcStore: Send + Sync {
  async fn get_short_user(
    &self,
    options: &GetDinoparcUserOptions,
  ) -> Result<Option<ArchivedDinoparcUser>, Box<dyn Error>>;

  async fn touch_short_user(&self, options: &ShortDinoparcUser) -> Result<ArchivedDinoparcUser, Box<dyn Error>>;
}
