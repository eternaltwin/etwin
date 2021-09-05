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
  #[error("Missing profile user link")]
  MissingProfileUserIdLink,
  #[error("Missing h2 selector on user page")]
  MissingH2Selector,
  #[error("Missing profile username")]
  MissingProfileUsername,
  #[error("Missing profile user items")]
  MissingProfileUserItems,
  #[error("Missing profile user item")]
  MissingProfileUserItem,
  #[error("Invalid item name {:?}", .0)]
  InvalidItemName(String),
  #[error("Invalid sub profile id {:?}", .0)]
  InvalidSubProfileId(String),
  #[error("Missing ID attribute on sub profile div")]
  MissingIDAttribute,
  #[error("Missing handicap td selector while scraping user sub profile")]
  MissingHandicapTDSelector,
  #[error("Missing an handicap value on user profile")]
  MissingHandicapValue,
  #[error("Invalid handicap value {:?}", .0)]
  InvalidHandicapValue(String),
  #[error("Missing game played td selector while scraping user sub profile")]
  MissingGamePlayedTDSelector,
  #[error("Missing an game played value on user profile")]
  MissingGamePlayedValue,
  #[error("Invalid game played value {:?}", .0)]
  InvalidGamePlayedValue(String),
  #[error("Missing speed div selector while scraping user sub profile")]
  MissingSpeedDivSelector,
  #[error("Missing a speed value on user profile")]
  MissingSpeedValue,
  #[error("Invalid speed value {:?}", .0)]
  InvalidSpeedValue(String),
  #[error("Missing creativity div selector while scraping user sub profile")]
  MissingCreativityDivSelector,
  #[error("Missing a creativity value on user profile")]
  MissingCreativityValue,
  #[error("Invalid creativity value {:?}", .0)]
  InvalidCreativityValue(String),
  #[error("Missing wisdom div selector while scraping user sub profile")]
  MissingWisdomDivSelector,
  #[error("Missing a wisdom value on user profile")]
  MissingWisdomValue,
  #[error("Invalid wisdom value {:?}", .0)]
  InvalidWisdomValue(String),
  #[error("Missing efficiency on user profile")]
  MissingProfileEfficiency,
  #[error("Missing efficiency value")]
  MissingEfficiencyValue,
  #[error("Invalid efficiency value {:?}", .0)]
  InvalidEfficiencyValue(String),
  #[error("Missing rank a selector on user page")]
  MissingRankSelector,
  #[error("Missing rank while splitting the string")]
  MissingRank,
  #[error("Invalid rank value {:?}", .0)]
  InvalidRank(String),
  #[error("Missing score span selector on user page")]
  MissingScoreSelector,
  #[error("Missing score while splitting the string")]
  MissingScore,
  #[error("Invalid score value {:?}", .0)]
  InvalidScore(String),
  #[error("Missing leaderboard selector on user page")]
  MissingLeaderboardSelector,
  #[error("Missing leaderboard src attribute")]
  MissingLeaderboardSRC,
  #[error("Invalid leaderboard value {:?}", .0)]
  InvalidLeaderboard(String),
  #[error("Missing moderator status on user page")]
  MissingModeratorStatus,
  #[error("Missing cups selector on user page")]
  MissingCupsSelector,
  #[error("Missing nb of cups won on user page (user should have won cups)")]
  MissingNbCupWonValue,
  #[error("Invalid number of cup won value {:?}", .0)]
  InvalidNbCupWonValue(String),
  #[error("Missing unique rewards div selector on user page")]
  MissinguniqueRewardsSelector,
  #[error("Missing unique reward link while scraping user page")]
  MissingUniqueRewardLink,
  #[error("Invalid unique reward value {:?}", .0)]
  InvalidUniqueRewardName(String),
  #[error("Missing creation date ul selector on user page")]
  MissingCreationDateSelector,
  #[error("Missing profile creation date on user page")]
  MissingCreationDate,
  #[error("Invalid user creation date {:?}", .0)]
  InvalidCreationDate(String),
  #[error("Missing personal infos selector on user page")]
  MissingPersonalInfosSelector,
  #[error("Missing sex li selector on user page")]
  MissingSexSelector,
  #[error("Missing birth date li selector on user page")]
  MissingBirthDateSelector,
  #[error("Invalid user birth date {:?}", .0)]
  InvalidBirthDate(String),
  #[error("Missing city li selector on user page")]
  MissingCitySelector,
  #[error("Invalid user city {:?}", .0)]
  InvalidCity(String),
  #[error("Missing country li selector on user page")]
  MissingCountrySelector,
  #[error("Invalid user country {:?}", .0)]
  InvalidCountry(String),
  #[error("Iterator error sex")]
  IteratorErrorSex,
  #[error("Iterator error BD1")]
  IteratorErrorBD1,
  #[error("Iterator error BD2")]
  IteratorErrorBD2,
  #[error("Iterator error city")]
  IteratorErrorCity,
  #[error("Iterator error country")]
  IteratorErrorCountry,
  #[error("Iterator error sub profile id")]
  IteratorErrorSubProfileId,
  #[error("Iterator error Creation Date 1")]
  IteratorErrorCreationDate1,
  #[error("Iterator error Creation Date 2")]
  IteratorErrorCreationDate2,
  #[error("Iterator error rewards")]
  IteratorErrorRewards1,
  #[error("Iterator error rewards")]
  IteratorErrorRewards2,
  #[error("Iterator error cups")]
  IteratorErrorCups,
  #[error("Iterator error leaderboard")]
  IteratorErrorLB,
  #[error("Iterator error score")]
  IteratorErrorScore,
  #[error("Iterator error rank")]
  IteratorErrorRank,
}
