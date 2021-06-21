use sqlx::{postgres, Postgres};
use std::convert::TryInto;
use std::error::Error;

#[derive(Debug, Copy, Clone, Ord, PartialOrd, Eq, PartialEq)]
pub struct PgU8(u8);

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

impl From<PgU8> for i64 {
  fn from(v: PgU8) -> Self {
    v.0.into()
  }
}

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for PgU8 {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("u8")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info() || *ty == i16::type_info()
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

#[derive(Debug, Copy, Clone, Ord, PartialOrd, Eq, PartialEq)]
pub struct PgU16(u16);

impl From<u16> for PgU16 {
  fn from(v: u16) -> Self {
    Self(v)
  }
}

impl From<PgU16> for u16 {
  fn from(v: PgU16) -> Self {
    v.0
  }
}

impl From<PgU16> for i64 {
  fn from(v: PgU16) -> Self {
    v.0.into()
  }
}

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for PgU16 {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("u16")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info() || *ty == i32::type_info()
  }
}

#[cfg(feature = "sqlx")]
impl<'r> sqlx::Decode<'r, Postgres> for PgU16 {
  fn decode(value: postgres::PgValueRef<'r>) -> Result<Self, Box<dyn Error + 'static + Send + Sync>> {
    let v: i32 = <i32 as sqlx::Decode<Postgres>>::decode(value)?;
    let v: u16 = v.try_into().expect("invalid Postgres U16 value");
    Ok(v.into())
  }
}

#[cfg(feature = "sqlx")]
impl<'q> sqlx::Encode<'q, Postgres> for PgU16 {
  fn encode_by_ref(&self, buf: &mut postgres::PgArgumentBuffer) -> sqlx::encode::IsNull {
    let v: i32 = u16::from(*self).into();
    v.encode(buf)
  }
}

#[derive(Debug, Copy, Clone, Ord, PartialOrd, Eq, PartialEq)]
pub struct PgU32(u32);

impl From<u32> for PgU32 {
  fn from(v: u32) -> Self {
    Self(v)
  }
}

impl From<PgU32> for u32 {
  fn from(v: PgU32) -> Self {
    v.0
  }
}

impl From<PgU32> for i64 {
  fn from(v: PgU32) -> Self {
    v.0.into()
  }
}

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for PgU32 {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("u32")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info() || *ty == i64::type_info()
  }
}

#[cfg(feature = "sqlx")]
impl<'r> sqlx::Decode<'r, Postgres> for PgU32 {
  fn decode(value: postgres::PgValueRef<'r>) -> Result<Self, Box<dyn Error + 'static + Send + Sync>> {
    let v: i64 = <i64 as sqlx::Decode<Postgres>>::decode(value)?;
    let v: u32 = v.try_into().expect("invalid Postgres U32 value");
    Ok(v.into())
  }
}

#[cfg(feature = "sqlx")]
impl<'q> sqlx::Encode<'q, Postgres> for PgU32 {
  fn encode_by_ref(&self, buf: &mut postgres::PgArgumentBuffer) -> sqlx::encode::IsNull {
    let v: i64 = u32::from(*self).into();
    v.encode(buf)
  }
}
