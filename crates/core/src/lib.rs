// #![feature(auto_traits, negative_impls)]
// #![feature(once_cell)]

#[macro_use]
pub mod types;

pub mod api;
pub mod auth;
pub mod clock;
pub mod core;
pub mod dinoparc;
pub mod email;
pub mod hammerfest;
pub mod link;
pub mod password;
pub mod services {
  pub mod hammerfest;
}
pub mod twinoid;
pub mod user;
pub mod uuid;

#[cfg(all(feature = "serde", feature = "hex"))]
mod serde_buffer;
