use sqlx::{postgres, Postgres};
use std::convert::TryInto;
use std::error::Error;

#[derive(Copy, Clone, Ord, PartialOrd, Eq, PartialEq)]
pub(crate) struct PgU8(u8);

impl From<u8> for PgU8 {
  fn from(v: u8) -> Self {
    Self(v)
  }
}

impl From<PgU8> for u8 {
  fn from(v: PgU8) -> Self {
    v.0
  }
}

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for PgU8 {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("u8")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info()
  }
}

#[cfg(feature = "sqlx")]
impl<'r> sqlx::Decode<'r, Postgres> for PgU8 {
  fn decode(value: postgres::PgValueRef<'r>) -> Result<Self, Box<dyn Error + 'static + Send + Sync>> {
    let v: i16 = <i16 as sqlx::Decode<Postgres>>::decode(value)?;
    let v: u8 = v.try_into().expect("invalid Postgres U8 value");
    Ok(v.into())
  }
}

#[cfg(feature = "sqlx")]
impl<'q> sqlx::Encode<'q, Postgres> for PgU8 {
  fn encode_by_ref(&self, buf: &mut postgres::PgArgumentBuffer) -> sqlx::encode::IsNull {
    let v: i16 = u8::from(*self).into();
    v.encode(buf)
  }
}
