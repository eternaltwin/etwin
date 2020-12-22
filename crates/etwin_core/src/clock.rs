use crate::core::With;
use chrono::{DateTime, Duration, Utc};
use std::sync::atomic::{AtomicI64, Ordering};

pub trait Clock: Send + Sync + With {
  fn now(&self) -> DateTime<Utc>;
}

pub struct VirtualClock {
  start: DateTime<Utc>,
  offset: AtomicI64,
}

impl VirtualClock {
  pub fn new(start: DateTime<Utc>) -> Self {
    Self {
      start,
      offset: AtomicI64::new(0),
    }
  }
}

impl With for VirtualClock {}

impl Clock for VirtualClock {
  fn now(&self) -> DateTime<Utc> {
    let offset = self.offset.load(Ordering::SeqCst);
    self.start + Duration::microseconds(offset)
  }
}

// #[cfg(feature = "neon")]
// impl neon::prelude::Finalize for VirtualClock {}

pub struct SystemClock;

impl With for SystemClock {}

impl Clock for SystemClock {
  fn now(&self) -> DateTime<Utc> {
    Utc::now()
  }
}

// #[cfg(feature = "neon")]
// impl neon::prelude::Finalize for SystemClock {}
