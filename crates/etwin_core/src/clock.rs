use chrono::{DateTime, Utc, Duration};
use std::sync::atomic::{Ordering, AtomicI64};
use crate::core::With;

pub trait Clock: Send + Sync + With {
  fn now(&self) -> DateTime<Utc>;
}

pub struct VirtualClock {
  start: DateTime<Utc>,
  offset: AtomicI64,
}

impl VirtualClock {
  pub fn new(start: DateTime<Utc>) -> Self {
    Self { start, offset: AtomicI64::new(0) }
  }
}

impl With for VirtualClock {}

impl Clock for VirtualClock {
  fn now(&self) -> DateTime<Utc> {
    let offset = self.offset.load(Ordering::SeqCst);
    self.start + Duration::microseconds(offset)
  }
}

pub struct SystemClock;

impl With for SystemClock {}

impl Clock for SystemClock {
  fn now(&self) -> DateTime<Utc> {
    Utc::now()
  }
}
