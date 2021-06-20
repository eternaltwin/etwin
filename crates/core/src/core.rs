use crate::user::{ShortUser, UserIdRef};
use chrono::{DateTime, Utc};
#[cfg(feature = "_serde")]
use serde::{Deserialize, Serialize};
use std::ops::{Range, RangeFrom};

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

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum Period {
  From(PeriodFrom),
  Finite(FinitePeriod),
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
  type SqlType = i16;
  const SQL_NAME = "int_percentage";
}
