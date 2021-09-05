use crate::types::AnyError;
use async_trait::async_trait;
use auto_impl::auto_impl;
use enum_iterator::IntoEnumIterator;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, IntoEnumIterator)]
pub enum PopotamoServer {
  #[cfg_attr(feature = "_serde", serde(rename = "popotamo.com"))]
  PopotamoCom,
  // #[cfg_attr(feature = "_serde", serde(rename = "en.popotamo.com"))]
  // EnPopotamoCom,
}

declare_decimal_id! {
  pub struct PopotamoUserId(u32);
  pub type ParseError = PopotamoUserIdParseError;
  const BOUNDS = 0..1_000_000_000;
  const SQL_NAME = "popotamo_user_id";
}

declare_decimal_id! {
  pub struct PopotamoUserHandicap(u32);
  pub type ParseError = PopotamoUserHandicapParseError;
  const BOUNDS = 250..651;
  const SQL_NAME = "popotamo_user_handicap";
}
declare_decimal_id! {
  pub struct PopotamoGamePlayed(u32);
  pub type ParseError = PopotamoGamePlayedParseError;
  const BOUNDS = 0..1_000_000_000;
  const SQL_NAME = "popotamo_game_played";
}

declare_decimal_id! {
  pub struct PopotamoSubProfileId(u32);
  pub type ParseError = PopotamoSubProfileIdParseError;
  const BOUNDS = 0..1_000_000_000;
  const SQL_NAME = "popotamo_user_sub_profile_id";
}

declare_decimal_id! {
  pub struct PopotamoUserSkill(u32);
  pub type ParseError = PopotamoUserSkillParseError;
  const BOUNDS = 0..11;
  const SQL_NAME = "popotamo_user_skill";
}

declare_decimal_id! {
  pub struct PopotamoEfficiency(u32);
  pub type ParseError = PopotamoEfficiencyParseError;
  const BOUNDS = 0..1_000_000_000;
  const SQL_NAME = "popotamo_user_efficiency";
}

declare_decimal_id! {
  pub struct PopotamoUserRank(u32);
  pub type ParseError = PopotamoUserRankParseError;
  const BOUNDS = 0..500_000;
  const SQL_NAME = "popotamo_user_rank";
}

declare_decimal_id! {
  pub struct PopotamoScore(u32);
  pub type ParseError = PopotamoScoreParseError;
  const BOUNDS = 0..69_342;
  const SQL_NAME = "popotamo_score";
}

declare_decimal_id! {
  pub struct PopotamoUserLeaderboard(u32);
  pub type ParseError = PopotamoUserLeaderboardParseError;
  const BOUNDS = 1..5;
  const SQL_NAME = "popotamo_user_leadearboard";
}
declare_decimal_id! {
  pub struct PopotamoNbCupWon(u32);
  pub type ParseError = PopotamoNbCupWonParseError;
  const BOUNDS = 0..200; //There is one cup per mounth since March 2007, which leads to a number of 169 in September 2021
  const SQL_NAME = "popotamo_nb_cups_won";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "PopotamoUser"))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PopotamoUserIdRef {
  pub server: PopotamoServer,
  pub id: PopotamoUserId,
}

declare_new_string! {
  pub struct PopotamoUsername(String);
  pub type ParseError = PopotamoUsernameParseError;
  const PATTERN = r"^[0-9A-Za-z_-]{1,12}$";
  const SQL_NAME = "popotamo_username";
}

declare_new_string! {
  pub struct PopotamoUserItem(String);
  pub type ParseError = PopotamoUserItemParseError;
  const PATTERN = r"^[0-9A-Za-zéèê]{1,12}$";
  const SQL_NAME = "popotamo_useritem";
}

declare_new_string! {
  pub struct PopotamoUserUniqueReward(String);
  pub type ParseError = PopotamoUserUniqueRewardParseError;
  const PATTERN = r"^[0-9A-Za-zéèê]{1,20}$";
  const SQL_NAME = "popotamo_user_unique_reward";
}

declare_new_string! {
  pub struct PopotamoUserCity(String);
  pub type ParseError = PopotamoUserCityParseError;
  const PATTERN = r"^[0-9A-Za-zéèê\s]{1,30}$";
  const SQL_NAME = "popotamo_user_city";
}

declare_new_string! {
  pub struct PopotamoUserCreationDate(String);
  pub type ParseError = PopotamoUserCreationDateParseError;
  const PATTERN = r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$";
  const SQL_NAME = "popotamo_user_creation_date";
}

declare_new_string! {
  pub struct PopotamoUserBirthDate(String);
  pub type ParseError = PopotamoUserBirthDateParseError;
  const PATTERN = r"^\d{2}/\d{2}/\d{4}$";
  const SQL_NAME = "popotamo_user_birth_date";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum PopotamoUserSex {
  Homme,
  Femme,
}

declare_new_string! {
  pub struct PopotamoUserCountry(String);
  pub type ParseError = PopotamoUserCountryError;
  const PATTERN = r"^[0-9A-Za-zéèê\s]{1,25}$";
  const SQL_NAME = "popotamo_user_country";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PopotamoPassword(String);

impl PopotamoPassword {
  pub fn new(raw: String) -> Self {
    Self(raw)
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PopotamoCredentials {
  pub username: PopotamoUsername,
  pub password: PopotamoPassword,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "PopotamoUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortPopotamoUser {
  pub server: PopotamoServer,
  pub id: PopotamoUserId,
  pub username: PopotamoUsername,
}

impl ShortPopotamoUser {
  pub const fn as_ref(&self) -> PopotamoUserIdRef {
    PopotamoUserIdRef {
      server: self.server,
      id: self.id,
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PopotamoUserPersonalInfos {
  pub sex: Option<PopotamoUserSex>,
  pub birth_date: Option<PopotamoUserBirthDate>,
  pub city: Option<PopotamoUserCity>,
  pub country: Option<PopotamoUserCountry>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PopotamoUserSkills {
  pub speed: PopotamoUserSkill,
  pub creativity: PopotamoUserSkill,
  pub wisdom: PopotamoUserSkill,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PopotamoUserEfficiency {
  pub first_place: PopotamoEfficiency,
  pub second_place: PopotamoEfficiency,
  pub third_place: PopotamoEfficiency,
  pub fourth_place: PopotamoEfficiency,
  pub fifth_place: PopotamoEfficiency,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PopotamoSubProfile {
  pub id: PopotamoSubProfileId,
  pub items: Vec<PopotamoUserItem>,
  pub handicap: PopotamoUserHandicap,
  pub game_played: PopotamoGamePlayed,
  pub skills: PopotamoUserSkills,
  pub efficiency: PopotamoUserEfficiency,
}

/// Data in the top right for logged-in users
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PopotamoSessionUser {
  pub user: ShortPopotamoUser,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PopotamoProfileResponse {
  pub session_user: Option<PopotamoSessionUser>,
  pub profile: PopotamoProfile,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PopotamoProfile {
  pub user: ShortPopotamoUser,
  pub creation_date: PopotamoUserCreationDate,
  pub score: PopotamoScore,
  pub rank: PopotamoUserRank,
  pub ismoderator: bool,
  pub nb_cups_won: PopotamoNbCupWon,
  pub leaderboard: PopotamoUserLeaderboard,
  pub unique_rewards: Vec<PopotamoUserUniqueReward>,
  pub sub_profiles: Vec<PopotamoSubProfile>,
  pub personal_infos: PopotamoUserPersonalInfos,
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait PopotamoClient: Send + Sync {
  async fn get_profile(&self, id: PopotamoUserIdRef) -> Result<PopotamoProfileResponse, AnyError>;
}
