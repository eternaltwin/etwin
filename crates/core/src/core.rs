#[cfg(feature = "sqlx")]
use crate::pg_num::PgU8;
use crate::user::{ShortUser, UserIdRef};
use chrono::{DateTime, Utc};
#[cfg(feature = "_serde")]
use serde::{Deserialize, Serialize};
#[cfg(feature = "sqlx")]
use sqlx::postgres::types::PgRange;
#[cfg(feature = "sqlx")]
use sqlx::{postgres, Postgres};
#[cfg(feature = "sqlx")]
use std::ops::Bound;
use std::ops::{Range, RangeFrom};
#[cfg(feature = "sqlx")]
use thiserror::Error;

pub type Instant = DateTime<Utc>;

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PeriodFrom {
  pub start: Instant,
}

impl From<RangeFrom<Instant>> for PeriodFrom {
  fn from(r: RangeFrom<Instant>) -> Self {
    Self { start: r.start }
  }
}

impl From<PeriodFrom> for RangeFrom<Instant> {
  fn from(r: PeriodFrom) -> Self {
    r.start..
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct FinitePeriod {
  pub start: Instant,
  pub end: Instant,
}

impl From<Range<Instant>> for FinitePeriod {
  fn from(r: Range<Instant>) -> Self {
    Self {
      start: r.start,
      end: r.end,
    }
  }
}

impl From<FinitePeriod> for Range<Instant> {
  fn from(r: FinitePeriod) -> Self {
    r.start..r.end
  }
}

/// Represents the raw `PERIOD` Postgres type. It should not be used directly.
#[cfg(feature = "sqlx")]
struct PgPeriod;

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for PgPeriod {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("period")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info()
  }
}

/// Represents any period with a lower bound
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum PeriodLower {
  From(PeriodFrom),
  Finite(FinitePeriod),
}

impl PeriodLower {
  pub const fn unbounded(start: Instant) -> Self {
    Self::From(PeriodFrom { start })
  }
}

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for PeriodLower {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("period_lower")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info() || *ty == PgPeriod::type_info() || *ty == (PgRange::<Instant>::type_info())
  }
}

#[cfg(feature = "sqlx")]
#[derive(Debug, Error)]
#[error("decoded invalid Postgres PERIOD_LOWER as {:?}", .0)]
struct InvalidPeriodLower(PgRange<Instant>);

#[cfg(feature = "sqlx")]
impl<'r> sqlx::Decode<'r, Postgres> for PeriodLower {
  fn decode(value: postgres::PgValueRef<'r>) -> Result<Self, Box<dyn std::error::Error + 'static + Send + Sync>> {
    let range = PgRange::<Instant>::decode(value)?;
    match (range.start, range.end) {
      (Bound::Included(start), Bound::Unbounded) => Ok(PeriodLower::From(PeriodFrom { start })),
      (Bound::Included(start), Bound::Excluded(end)) => Ok(PeriodLower::Finite(FinitePeriod { start, end })),
      _ => Err(Box::new(InvalidPeriodLower(range))),
    }
  }
}

#[cfg(feature = "sqlx")]
impl<'q> sqlx::Encode<'q, Postgres> for PeriodLower {
  fn encode_by_ref(&self, buf: &mut postgres::PgArgumentBuffer) -> sqlx::encode::IsNull {
    let range: PgRange<Instant> = match *self {
      Self::Finite(FinitePeriod { start, end }) => (start..end).into(),
      Self::From(PeriodFrom { start }) => (start..).into(),
    };
    range.encode_by_ref(buf)
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserDot {
  pub time: Instant,
  pub user: ShortUser,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawUserDot {
  pub time: Instant,
  pub user: UserIdRef,
}

#[derive(Clone)]
pub struct Secret(String);

impl Secret {
  pub fn new(str: String) -> Self {
    Self(str)
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

declare_new_int! {
  /// A percentage value between 0 and 100 (inclusive) supporting only integer
  /// values.
  pub struct IntPercentage(u8);
  pub type RangeError = IntPercentageRangeError;
  const BOUNDS = 0..=100;
  type SqlType = PgU8;
  const SQL_NAME = "int_percentage";
}
