pub(crate) mod errors;

#[cfg(feature = "http")]
mod http;
#[cfg(feature = "mem")]
mod mem;

#[cfg(feature = "http")]
pub use http::HttpHammerfestClient;
#[cfg(feature = "mem")]
pub use mem::MemHammerfestClient;
