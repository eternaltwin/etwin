use etwin_core::email::EmailAddressParseError;
use etwin_core::hammerfest::*;
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
  InvalidDate(String, #[source] Option<chrono::format::ParseError>),
  #[error("Failed to parse email '{}'", .0)]
  InvalidEmail(String, #[source] EmailAddressParseError),
  #[error("Invalid item id '{}'", .0)]
  InvalidItemId(String, #[source] HammerfestItemIdParseError),
  #[error("Invalid user id '{}'", .0)]
  InvalidUserId(String, #[source] HammerfestUserIdParseError),
  #[error("Invalid forum theme id '{}'", .0)]
  InvalidForumThemeId(String, #[source] HammerfestForumThemeIdParseError),
  #[error("Invalid forum thread id '{}'", .0)]
  InvalidForumThreadId(String, #[source] HammerfestForumThreadIdParseError),
  #[error("Invalid forum post id '{}'", .0)]
  InvalidForumPostId(String, #[source] HammerfestForumPostIdParseError),
  #[error("Invalid username '{}'", .0)]
  InvalidUsername(String, #[source] HammerfestUsernameParseError),
  #[error("Unknown quest name '{}'", .0)]
  UnknownQuestName(String),
  #[error("Unknown rank CSS class '{}'", .0)]
  UnknownRankClass(String),
  #[error("Unknown user role")]
  UnknownUserRole,
  #[error("Unexpected thread kind: '{}'", .0)]
  UnexpectedThreadKind(String),
}
