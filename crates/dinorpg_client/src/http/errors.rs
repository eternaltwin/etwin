use thiserror::Error;

#[derive(Debug, Error)]
pub enum ScraperError {
  #[error("HTTP Error")]
  HttpError(#[from] reqwest::Error),
}
