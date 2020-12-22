use uuid::Uuid;

/// Infinite UUID generator
pub trait UuidGenerator: Send + Sync {
  fn next(&self) -> Uuid;
}

pub struct Uuid4Generator;

impl UuidGenerator for Uuid4Generator {
  fn next(&self) -> Uuid {
    uuid::Uuid::new_v4()
  }
}

// #[cfg(feature = "neon")]
// impl neon::prelude::Finalize for Uuid4Generator {}
