use thiserror::Error;

#[derive(Debug, Error)]
pub enum ScraperError {
  #[error("Duplicate session box, expected zero or one")]
  DuplicateSessionBox,
  #[error("Non-unique session-user rewards, expected exactly one")]
  NonUniqueSessionUserRewards,
  #[error("Missing session-user link, expected exactly one")]
  MissingSessionUserLink,
  #[error("Non-unique session user link text node, expected exactly one")]
  NonUniqueSessionUserLinkText,
  #[error("Invalid user id {:?}", .0)]
  InvalidUserId(String),
  #[error("Invalid username {:?}", .0)]
  InvalidUsername(String),
  #[error("Missing href attribute on link")]
  MissingLinkHref,
  #[error("Invalid user link {:?}", .0)]
  InvalidUserLink(String),
  #[error("HTTP Error")]
  HttpError(#[from] reqwest::Error),
}
