use auto_impl::auto_impl;
use etwin_serde_tools::Deserializer;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{buffer_to_hex, hex_to_buffer, Deserialize, Serialize};
#[cfg(feature = "sqlx")]
use sqlx::{database, postgres, Database, Postgres};

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Password(pub Vec<u8>);

#[cfg(feature = "_serde")]
impl Serialize for Password {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::Serializer,
  {
    self.0.serialize(serializer)
  }
}

#[cfg(feature = "_serde")]
impl<'de> Deserialize<'de> for Password {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: Deserializer<'de>,
  {
    let bytes = Vec::<u8>::deserialize(deserializer)?;
    Ok(Password(bytes))
  }
}

impl From<&[u8]> for Password {
  fn from(value: &[u8]) -> Self {
    Self(Vec::from(value))
  }
}

impl From<&str> for Password {
  fn from(value: &str) -> Self {
    Self(Vec::from(value.as_bytes()))
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PasswordHash(
  #[cfg_attr(
    feature = "_serde",
    serde(serialize_with = "buffer_to_hex", deserialize_with = "hex_to_buffer")
  )]
  pub Vec<u8>,
);

impl PasswordHash {
  pub fn as_slice(&self) -> &[u8] {
    &self.0
  }
}

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for PasswordHash {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("password_hash")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info() || <&[u8] as sqlx::Type<Postgres>>::compatible(ty)
  }
}

#[cfg(feature = "sqlx")]
impl<'r, Db: Database> sqlx::Decode<'r, Db> for PasswordHash
where
  &'r [u8]: sqlx::Decode<'r, Db>,
{
  fn decode(
    value: <Db as database::HasValueRef<'r>>::ValueRef,
  ) -> Result<PasswordHash, Box<dyn std::error::Error + 'static + Send + Sync>> {
    let value: &[u8] = <&[u8] as sqlx::Decode<Db>>::decode(value)?;
    Ok(value.into())
  }
}

#[cfg(feature = "sqlx")]
impl<'q, Db: Database> sqlx::Encode<'q, Db> for PasswordHash
where
  Vec<u8>: sqlx::Encode<'q, Db>,
{
  fn encode_by_ref(&self, buf: &mut <Db as database::HasArguments<'q>>::ArgumentBuffer) -> sqlx::encode::IsNull {
    self.as_slice().to_vec().encode(buf)
  }
}

impl From<&[u8]> for PasswordHash {
  fn from(value: &[u8]) -> Self {
    Self(Vec::from(value))
  }
}

#[auto_impl(&, Arc)]
pub trait PasswordService: Send + Sync {
  /// Converts a password's clear text into a hash.
  fn hash(&self, clear_text: Password) -> PasswordHash;

  /// Verifies if the hash and password match.
  fn verify(&self, hash: PasswordHash, clear_text: Password) -> bool;
}
