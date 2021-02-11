use etwin_core::dinoparc::DinoparcUserIdParseError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ScraperError {
  #[error("Failed to login due to unexpected login response")]
  UnexpectedLoginResponse,
  // #[error("Invalid credentials on {} for username: {}", .0.as_str(), .1.as_str())]
  // InvalidCredentials(DinoparcServer, DinoparcUsername),
  #[error("Missing Dinoparc session cookie from response")]
  MissingSessionCookie,
  #[error("Dinoparc session cookie is invalid or malformed")]
  InvalidSessionCookie,
  #[error("Failed to login due to unexpected ad tracking response")]
  UnexpectedAdTrackingResponse,
  #[error("Failed to login due to unexpected login confirmation response")]
  UnexpectedLoginConfirmationResponse,
  // #[error("Session was revoked by Hammerfest during login")]
  // LoginSessionRevoked,
  // #[error("Hammerfest returned an unexpected response for page {}", .0)]
  // UnexpectedResponse(Url),
  // #[error("Failed to find fragment in HTML for {}", .0)]
  // HtmlFragmentNotFound(String),
  // #[error("Found too many fragments in HTML for {}", .0)]
  // TooManyHtmlFragments(String),
  // #[error("Failed to parse integer value '{}'", .0)]
  // InvalidInteger(String, #[source] std::num::ParseIntError),
  // #[error("Failed to parse date '{}'", .0)]
  // InvalidDate(String, #[source] Option<chrono::format::ParseError>),
  // #[error("Invalid item id '{}'", .0)]
  // InvalidItemId(String, HammerfestItemIdParseError),
  #[error("Invalid dinoparc user id '{}'", .0)]
  InvalidUserId(String, DinoparcUserIdParseError),
  #[error("Unexpected bank cashFrame argument {:?}: {}", .0, .1)]
  UnexpectedCashFrameArgument(String, &'static str),
  #[error("Multiple cashFrame calls")]
  MultipleCashFrameCalls,
  // #[error("Invalid forum theme id '{}'", .0)]
  // InvalidForumThemeId(String, HammerfestForumThemeIdParseError),
  // #[error("Invalid forum thread id '{}'", .0)]
  // InvalidForumThreadId(String, HammerfestForumThreadIdParseError),
  // #[error("Invalid forum post id '{}'", .0)]
  // InvalidForumPostId(String, HammerfestForumPostIdParseError),
  // #[error("Invalid username '{}'", .0)]
  // InvalidUsername(String, HammerfestUsernameParseError),
  // #[error("Unknown quest name '{}'", .0)]
  // UnknownQuestName(String),
  // #[error("Unknown rank CSS class '{}'", .0)]
  // UnknownRankClass(String),
  // #[error("Unknown user role")]
  // UnknownUserRole,
  // #[error("Unexpected thread kind: '{}'", .0)]
  // UnexpectedThreadKind(String),
  #[error("HTTP Error")]
  HttpError(#[from] reqwest::Error),
}
