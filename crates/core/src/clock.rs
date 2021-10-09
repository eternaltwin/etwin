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

  pub fn advance_by(&self, d: Duration) {
    let d: i64 = d.num_milliseconds();
    assert!(d >= 0);
    self.offset.fetch_add(d, Ordering::SeqCst);
  }

  pub fn advance_to(&self, t: Instant) {
    assert!(t >= self.start);
    let new_duration = t.into_chrono() - self.start.into_chrono();
    let new_offset = new_duration.num_milliseconds();
    let old_offset = self.offset.fetch_max(new_offset, Ordering::SeqCst);
    assert!(new_offset >= old_offset);
  }
}

impl Clock for VirtualClock {
  fn now(&self) -> Instant {
    let offset = self.offset.load(Ordering::SeqCst);
    Instant::new_round_down(self.start.into_chrono() + Duration::milliseconds(offset))
  }
}

#[cfg(feature = "neon")]
impl neon::prelude::Finalize for VirtualClock {}

pub struct SystemClock;

impl Clock for SystemClock {
  fn now(&self) -> Instant {
    Instant::new_round_down(Utc::now())
  }
}

#[cfg(feature = "neon")]
impl neon::prelude::Finalize for SystemClock {}
