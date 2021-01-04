use crate::core::Instant;
use auto_impl::auto_impl;
use chrono::{Duration, Utc};
use std::sync::atomic::{AtomicI64, Ordering};

#[auto_impl(&, Arc)]
pub trait Clock: Send + Sync {
  fn now(&self) -> Instant;
}

pub struct VirtualClock {
  start: Instant,
  offset: AtomicI64,
}

impl VirtualClock {
  pub fn new(start: Instant) -> Self {
    Self {
      start,
      offset: AtomicI64::new(0),
    }
  }
}

impl Clock for VirtualClock {
  fn now(&self) -> Instant {
    let offset = self.offset.load(Ordering::SeqCst);
    self.start + Duration::microseconds(offset)
  }
}

#[cfg(feature = "neon")]
impl neon::prelude::Finalize for VirtualClock {}

pub struct SystemClock;

impl Clock for SystemClock {
  fn now(&self) -> Instant {
    Utc::now()
  }
}

#[cfg(feature = "neon")]
impl neon::prelude::Finalize for SystemClock {}
