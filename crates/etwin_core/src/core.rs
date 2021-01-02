use chrono::{DateTime, Utc};
use crate::user::{ShortUser, UserIdRef};
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
