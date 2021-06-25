#[cfg(feature = "sqlx")]
use crate::pg_num::PgU8;
use crate::user::{ShortUser, UserIdRef};
use chrono::{DateTime, Utc};
#[cfg(feature = "_serde")]
use etwin_serde_tools::{serialize_instant, serialize_opt_instant, Deserialize, Serialize, Serializer};
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

/// Private type used to serialize PeriodLower and its variants.
#[cfg(feature = "_serde")]
#[derive(Debug, Copy, Clone, Eq, PartialEq, Serialize, Deserialize)]
struct SerializablePeriodLower {
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_instant"))]
  pub start: Instant,
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_opt_instant"))]
  pub end: Option<Instant>,
}

#[cfg(feature = "_serde")]
impl From<PeriodFrom> for SerializablePeriodLower {
  fn from(period: PeriodFrom) -> Self {
    Self {
      start: period.start,
      end: None,
    }
  }
}

#[cfg(feature = "_serde")]
impl From<FinitePeriod> for SerializablePeriodLower {
  fn from(period: FinitePeriod) -> Self {
    Self {
      start: period.start,
      end: Some(period.end),
    }
  }
}

#[cfg(feature = "_serde")]
impl From<PeriodLower> for SerializablePeriodLower {
  fn from(period: PeriodLower) -> Self {
    match period {
      PeriodLower::From(p) => p.into(),
      PeriodLower::Finite(p) => p.into(),
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PeriodFrom {
  pub start: Instant,
}

#[cfg(feature = "_serde")]
impl Serialize for PeriodFrom {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    SerializablePeriodLower::from(*self).serialize(serializer)
  }
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

#[cfg_attr(feature = "_serde", derive(Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct FinitePeriod {
  pub start: Instant,
  pub end: Instant,
}

#[cfg(feature = "_serde")]
impl Serialize for FinitePeriod {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    SerializablePeriodLower::from(*self).serialize(serializer)
  }
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
#[cfg_attr(feature = "_serde", derive(Deserialize), serde(untagged))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum PeriodLower {
  Finite(FinitePeriod),
  From(PeriodFrom),
}

impl PeriodLower {
  pub const fn unbounded(start: Instant) -> Self {
    Self::From(PeriodFrom { start })
  }
}

#[cfg(feature = "_serde")]
impl Serialize for PeriodLower {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    SerializablePeriodLower::from(*self).serialize(serializer)
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

#[cfg(test)]
mod test {
  use crate::core::{FinitePeriod, PeriodFrom, PeriodLower};
  use chrono::{TimeZone, Utc};
  use std::fs;

  #[allow(clippy::unnecessary_wraps)]
  fn get_finite_period_one_millisecond() -> FinitePeriod {
    FinitePeriod {
      start: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      end: Utc.ymd(2021, 1, 1).and_hms_milli(0, 0, 0, 1),
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_finite_period_one_millisecond() {
    let s = fs::read_to_string("../../test-resources/core/core/finite-period/one-millisecond/value.json").unwrap();
    let actual: FinitePeriod = serde_json::from_str(&s).unwrap();
    let expected = get_finite_period_one_millisecond();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_finite_period_one_millisecond() {
    let value = get_finite_period_one_millisecond();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected =
      fs::read_to_string("../../test-resources/core/core/finite-period/one-millisecond/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  #[allow(clippy::unnecessary_wraps)]
  fn get_finite_period_one_second() -> FinitePeriod {
    FinitePeriod {
      start: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      end: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_finite_period_one_second() {
    let s = fs::read_to_string("../../test-resources/core/core/finite-period/one-second/value.json").unwrap();
    let actual: FinitePeriod = serde_json::from_str(&s).unwrap();
    let expected = get_finite_period_one_second();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_finite_period_one_second() {
    let value = get_finite_period_one_second();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/core/finite-period/one-second/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  #[allow(clippy::unnecessary_wraps)]
  fn get_period_from_unbounded() -> PeriodFrom {
    PeriodFrom {
      start: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_period_from_unbounded() {
    let s = fs::read_to_string("../../test-resources/core/core/period-from/unbounded/value.json").unwrap();
    let actual: PeriodFrom = serde_json::from_str(&s).unwrap();
    let expected = get_period_from_unbounded();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_period_from_unbounded() {
    let value = get_period_from_unbounded();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/core/period-from/unbounded/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  #[allow(clippy::unnecessary_wraps)]
  fn get_period_lower_one_millisecond() -> PeriodLower {
    PeriodLower::Finite(FinitePeriod {
      start: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      end: Utc.ymd(2021, 1, 1).and_hms_milli(0, 0, 0, 1),
    })
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_period_lower_one_millisecond() {
    let s = fs::read_to_string("../../test-resources/core/core/period-lower/one-millisecond/value.json").unwrap();
    let actual: PeriodLower = serde_json::from_str(&s).unwrap();
    let expected = get_period_lower_one_millisecond();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_period_lower_one_millisecond() {
    let value = get_period_lower_one_millisecond();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected =
      fs::read_to_string("../../test-resources/core/core/period-lower/one-millisecond/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  #[allow(clippy::unnecessary_wraps)]
  fn get_period_lower_one_second() -> PeriodLower {
    PeriodLower::Finite(FinitePeriod {
      start: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      end: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
    })
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_period_lower_one_second() {
    let s = fs::read_to_string("../../test-resources/core/core/period-lower/one-second/value.json").unwrap();
    let actual: PeriodLower = serde_json::from_str(&s).unwrap();
    let expected = get_period_lower_one_second();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_period_lower_one_second() {
    let value = get_period_lower_one_second();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/core/period-lower/one-second/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  #[allow(clippy::unnecessary_wraps)]
  fn get_period_lower_unbounded() -> PeriodLower {
    PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0))
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_period_lower_unbounded() {
    let s = fs::read_to_string("../../test-resources/core/core/period-lower/unbounded/value.json").unwrap();
    let actual: PeriodLower = serde_json::from_str(&s).unwrap();
    let expected = get_period_lower_unbounded();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_period_lower_unbounded() {
    let value = get_period_lower_unbounded();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/core/period-lower/unbounded/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }
}
