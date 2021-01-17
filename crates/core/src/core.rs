use crate::user::{ShortUser, UserIdRef};
use chrono::{DateTime, Utc};
#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};

pub type Instant = DateTime<Utc>;

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserDot {
  pub time: Instant,
  pub user: ShortUser,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
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
