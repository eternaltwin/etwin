#[cfg(feature = "sqlx")]
use crate::pg_num::PgU8;
use crate::user::{ShortUser, UserIdRef};
use chrono::{DateTime, Duration, NaiveDateTime, TimeZone, Timelike, Utc};
use enum_iterator::IntoEnumIterator;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Deserializer, Serialize, Serializer};
#[cfg(feature = "sqlx")]
use sqlx::postgres::types::PgRange;
#[cfg(feature = "sqlx")]
use sqlx::{postgres, Postgres};
use std::fmt;
#[cfg(feature = "sqlx")]
use std::ops::Bound;
use std::ops::{Range, RangeFrom};
#[cfg(feature = "sqlx")]
use thiserror::Error;

pub type HtmlFragment = String;

declare_new_enum!(
  #[derive(IntoEnumIterator)]
  pub enum LocaleId {
    #[str("de-DE")]
    DeDe,
    #[str("en-US")]
    EnUs,
    #[str("eo")]
    Eo,
    #[str("es-SP")]
    EsSp,
    #[str("fr-FR")]
    FrFr,
  }
  pub type ParseError = LocaleIdParseError;
  const SQL_NAME = "locale_id";
);

/// A point in time, with a millisecond precision.
#[derive(Debug, Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Hash)]
pub struct Instant(DateTime<Utc>);

const NANOSECOND_PER_MILLISECOND: u32 = 1_000_000;

impl Instant {
  /// Round down nanosecond precision Chrono DateTime to to millisecond precision Instant.
  pub fn new_round_down(inner: DateTime<Utc>) -> Self {
    let nanos = inner.nanosecond();
    Self(
      inner
        .with_nanosecond(nanos - (nanos % NANOSECOND_PER_MILLISECOND))
        .expect("invalid time"),
    )
  }

  pub fn ymd_hms(year: i32, month: u32, day: u32, hour: u32, min: u32, sec: u32) -> Self {
    Self(Utc.ymd(year, month, day).and_hms(hour, min, sec))
  }

  pub fn ymd_hms_milli(year: i32, month: u32, day: u32, hour: u32, min: u32, sec: u32, milli: u32) -> Self {
    Self(Utc.ymd(year, month, day).and_hms_milli(hour, min, sec, milli))
  }

  /// Create an Instant from the number of POSIX seconds since 1970-01-01T00:00:00Z.
  ///
  /// Note: POSIX seconds are defined as 1/86400 of a day (they ignore leap seconds).
  pub fn from_posix_timestamp(secs: i64) -> Self {
    Self(DateTime::<Utc>::from_utc(NaiveDateTime::from_timestamp(secs, 0), Utc))
  }

  pub fn into_chrono(self) -> DateTime<Utc> {
    self.0
  }

  pub fn into_posix_timestamp(self) -> i64 {
    self.0.timestamp()
  }
}

impl fmt::Display for Instant {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    fmt::Display::fmt(&self.0, f)
  }
}

const INSTANT_FORMAT: &str = "%FT%T%.3fZ";

#[cfg(feature = "_serde")]
impl Serialize for Instant {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    self.0.format(INSTANT_FORMAT).to_string().serialize(serializer)
  }
}

#[cfg(feature = "_serde")]
impl<'de> Deserialize<'de> for Instant {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: Deserializer<'de>,
  {
    let inner = DateTime::<Utc>::deserialize(deserializer)?;
    Ok(Self::new_round_down(inner))
  }
}

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for Instant {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("instant")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info() || *ty == DateTime::<Utc>::type_info()
  }
}

#[cfg(feature = "sqlx")]
impl<'r> sqlx::Decode<'r, Postgres> for Instant {
  fn decode(value: postgres::PgValueRef<'r>) -> Result<Self, sqlx::error::BoxDynError> {
    let v: DateTime<Utc> = <DateTime<Utc> as sqlx::Decode<Postgres>>::decode(value)?;
    Ok(Self::new_round_down(v))
  }
}

#[cfg(feature = "sqlx")]
impl<'q> sqlx::Encode<'q, Postgres> for Instant {
  fn encode_by_ref(&self, buf: &mut postgres::PgArgumentBuffer) -> sqlx::encode::IsNull {
    let v: DateTime<Utc> = self.into_chrono();
    v.encode(buf)
  }
}

impl std::ops::Add<chrono::Duration> for Instant {
  type Output = Instant;

  fn add(self, rhs: Duration) -> Self::Output {
    Self::new_round_down(self.into_chrono() + rhs)
  }
}

/// Private type used to serialize PeriodLower and its variants.
#[cfg(feature = "_serde")]
#[derive(Debug, Copy, Clone, Eq, PartialEq, Serialize, Deserialize)]
struct SerializablePeriodLower {
  pub start: Instant,
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
  pub const fn new(start: Instant, end: Option<Instant>) -> Self {
    match end {
      Some(end) => Self::bounded(start, end),
      None => Self::unbounded(start),
    }
  }

  pub const fn unbounded(start: Instant) -> Self {
    Self::From(PeriodFrom { start })
  }

  pub const fn bounded(start: Instant, end: Instant) -> Self {
    Self::Finite(FinitePeriod { start, end })
  }

  /// Updates the end instant to be the minimum of the current end and provided value
  pub fn end_min(self, other_end: Option<Instant>) -> Self {
    if let Some(end) = other_end {
      Self::Finite(self.bounded_end_min(end))
    } else {
      self
    }
  }

  /// Updates the end instant to be the minimum of the current end and provided value
  pub fn bounded_end_min(self, other_end: Instant) -> FinitePeriod {
    match self {
      Self::From(PeriodFrom { start }) => FinitePeriod { start, end: other_end },
      Self::Finite(FinitePeriod { start, end }) => FinitePeriod {
        start,
        end: Instant::min(end, other_end),
      },
    }
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
    *ty == Self::type_info() || *ty == PgPeriod::type_info() || *ty == (PgRange::<DateTime<Utc>>::type_info())
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

// TODO SecretString/SecretBytes
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

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Listing<T> {
  pub offset: u32,
  pub limit: u32,
  pub count: u32,
  pub items: Vec<T>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ListingCount {
  pub count: u32,
}

#[cfg(test)]
mod test {
  use crate::core::{FinitePeriod, Instant, PeriodFrom, PeriodLower};
  #[cfg(feature = "_serde")]
  use std::fs;

  #[allow(clippy::unnecessary_wraps)]
  fn get_finite_period_one_millisecond() -> FinitePeriod {
    FinitePeriod {
      start: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
      end: Instant::ymd_hms_milli(2021, 1, 1, 0, 0, 0, 1),
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
      start: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
      end: Instant::ymd_hms(2021, 1, 1, 0, 0, 1),
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
      start: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
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
      start: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
      end: Instant::ymd_hms_milli(2021, 1, 1, 0, 0, 0, 1),
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
      start: Instant::ymd_hms(2021, 1, 1, 0, 0, 0),
      end: Instant::ymd_hms(2021, 1, 1, 0, 0, 1),
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
    PeriodLower::unbounded(Instant::ymd_hms(2021, 1, 1, 0, 0, 0))
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
