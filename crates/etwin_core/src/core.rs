use chrono::{DateTime, Utc};

pub type Instant = DateTime<Utc>;

pub trait Get<T> {
  fn get(&self) -> T;
}

pub trait GetRef<T> {
  fn get(&self) -> &T;
}

pub trait With {
  fn with<R>(&self, f: impl FnOnce(&Self) -> R) -> R
  where
    Self: Sized,
  {
    f(self)
  }
}
