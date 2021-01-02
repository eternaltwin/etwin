use etwin_core::hammerfest::{ HammerfestServer, HammerfestUsername };
use reqwest::Url;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ScraperError {
  #[error("EVNI page returned from Hammerfest")]
  Evni,
  #[error("Invalid credentials on {} for username: {}", .0.as_str(), .1.as_str())]
  InvalidCredentials(HammerfestServer, HammerfestUsername),
  #[error("Missing Hammerfest session cookie from response")]
  MissingSessionCookie,
  #[error("Hammerfest session cookie is invalid or malformed")]
  InvalidSessionCookie,
  #[error("Session was revoked by Hammerfest during login")]
  LoginSessionRevoked,
  #[error("Hammerfest returned an unexpected response for page {}", .0)]
  UnexpectedResponse(Url),
  #[error("Failed to find fragment in HTML for {}", .0)]
  HtmlFragmentNotFound(String),
  #[error("Found too many fragments in HTML for {}", .0)]
  TooManyHtmlFragments(String),
  #[error("Failed to parse integer value '{}'", .0)]
  InvalidInteger(String, #[source] std::num::ParseIntError),
  #[error("Failed to parse date '{}'", .0)]
  InvalidDate(String, #[source] chrono::format::ParseError),
  #[error("Invalid item id '{}'", .0)]
  InvalidItemId(String, () /* future parse error type */),
  #[error("Invalid user id '{}'", .0)]
  InvalidUserId(String, () /* future parse error type */),
  #[error("Invalid username '{}'", .0)]
  InvalidUsername(String, () /* future parse error type */),
  #[error("Unknown quest name '{}'", .0)]
  UnknownQuestName(String),
  #[error("Unknown rank CSS class '{}'", .0)]
  UnknownRankClass(String),
}
