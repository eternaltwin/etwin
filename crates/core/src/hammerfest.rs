use crate::core::Instant;
use crate::link::VersionedEtwinLink;
use async_trait::async_trait;
use auto_impl::auto_impl;
use once_cell::sync::Lazy;
use regex::Regex;
#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};
#[cfg(feature = "sqlx")]
use sqlx::{database, postgres, Database, Postgres};
use std::collections::{HashMap, HashSet};
use std::error::Error;
use std::fmt;
use std::str::FromStr;

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestPassword(String);

impl HammerfestPassword {
  pub fn new(raw: String) -> Self {
    Self(raw)
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum HammerfestServer {
  #[cfg_attr(feature = "serde", serde(rename = "hammerfest.fr"))]
  HammerfestFr,
  #[cfg_attr(feature = "serde", serde(rename = "hfest.net"))]
  HfestNet,
  #[cfg_attr(feature = "serde", serde(rename = "hammerfest.es"))]
  HammerfestEs,
}

impl HammerfestServer {
  pub const fn as_str(&self) -> &'static str {
    match self {
      Self::HammerfestFr => "hammerfest.fr",
      Self::HfestNet => "hfest.net",
      Self::HammerfestEs => "hammerfest.es",
    }
  }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestServerParseError;

impl fmt::Display for HammerfestServerParseError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "HammerfestServerParseError")
  }
}

impl Error for HammerfestServerParseError {}

impl FromStr for HammerfestServer {
  type Err = HammerfestServerParseError;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    match s {
      "hammerfest.fr" => Ok(Self::HammerfestFr),
      "hfest.net" => Ok(Self::HfestNet),
      "hammerfest.es" => Ok(Self::HammerfestEs),
      _ => Err(HammerfestServerParseError),
    }
  }
}

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for HammerfestServer {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("hammerfest_server")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info() || <&str as sqlx::Type<Postgres>>::compatible(ty)
  }
}

#[cfg(feature = "sqlx")]
impl<'r, Db: Database> sqlx::Decode<'r, Db> for HammerfestServer
where
  &'r str: sqlx::Decode<'r, Db>,
{
  fn decode(
    value: <Db as database::HasValueRef<'r>>::ValueRef,
  ) -> Result<HammerfestServer, Box<dyn Error + 'static + Send + Sync>> {
    let value: &str = <&str as sqlx::Decode<Db>>::decode(value)?;
    Ok(value.parse()?)
  }
}

#[cfg(feature = "sqlx")]
impl<'q, Db: Database> sqlx::Encode<'q, Db> for HammerfestServer
where
  &'q str: sqlx::Encode<'q, Db>,
{
  fn encode_by_ref(&self, buf: &mut <Db as database::HasArguments<'q>>::ArgumentBuffer) -> sqlx::encode::IsNull {
    self.as_str().encode(buf)
  }
}

#[cfg_attr(
  feature = "sqlx",
  derive(sqlx::Type),
  sqlx(transparent, rename = "hammerfest_username")
)]
#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestUsername(String);

impl HammerfestUsername {
  pub const PATTERN: Lazy<Regex> = Lazy::new(|| Regex::new(r"^[0-9A-Za-z]{1,12}$").unwrap());

  pub fn try_from_string(raw: String) -> Result<Self, ()> {
    if Self::PATTERN.is_match(&raw) {
      Ok(Self(raw))
    } else {
      Err(())
    }
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

declare_decimal_id! {
  pub struct HammerfestUserId(u32);
  pub type ParseError = HammerfestUserIdParseError;
  const BOUNDS = 1..1_000_000_000;
  const SQL_NAME = "hammerfest_user_id";
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestUserIdRef {
  pub server: HammerfestServer,
  pub id: HammerfestUserId,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestSessionKey(String);

impl HammerfestSessionKey {
  pub const PATTERN: Lazy<Regex> = Lazy::new(|| Regex::new(r"^[0-9a-z]{26}$").unwrap());

  pub fn try_from_string(raw: String) -> Result<Self, ()> {
    if Self::PATTERN.is_match(&raw) {
      Ok(Self(raw))
    } else {
      Err(())
    }
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestCredentials {
  pub server: HammerfestServer,
  pub username: HammerfestUsername,
  pub password: HammerfestPassword,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(tag = "type", rename = "HammerfestUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortHammerfestUser {
  pub server: HammerfestServer,
  pub id: HammerfestUserId,
  pub username: HammerfestUsername,
}

impl From<ArchivedHammerfestUser> for ShortHammerfestUser {
  fn from(value: ArchivedHammerfestUser) -> Self {
    Self {
      server: value.server,
      id: value.id,
      username: value.username,
    }
  }
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde", serde(tag = "type", rename = "HammerfestUser"))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ArchivedHammerfestUser {
  pub server: HammerfestServer,
  pub id: HammerfestUserId,
  pub username: HammerfestUsername,
  pub archived_at: Instant,
  pub profile: Option<ArchivedHammerfestProfile>,
  pub items: Option<ArchivedHammerfestItems>,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct HammerfestUser {
  pub server: HammerfestServer,
  pub id: HammerfestUserId,
  pub username: HammerfestUsername,
  pub archived_at: Instant,
  pub profile: Option<ArchivedHammerfestProfile>,
  pub items: Option<ArchivedHammerfestItems>,
  pub etwin: VersionedEtwinLink,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ArchivedHammerfestProfile {
  pub first_archived_at: Instant,
  pub last_archived_at: Instant,
  pub best_score: u32,
  pub best_level: u32,
  pub game_completed: bool,
  pub items: HashMap<HammerfestItemId, bool>,
  pub quests: HashMap<HammerfestQuestId, HammerfestQuestStatus>,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ArchivedHammerfestItems {
  pub first_archived_at: Instant,
  pub last_archived_at: Instant,
  pub items: HashMap<HammerfestItemId, u32>,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestSession {
  pub ctime: Instant,
  pub atime: Instant,
  pub key: HammerfestSessionKey,
  pub user: ShortHammerfestUser,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestGetProfileByIdOptions {
  pub server: HammerfestServer,
  pub user_id: HammerfestUserId,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct HammerfestProfile {
  pub user: ShortHammerfestUser,
  #[cfg_attr(feature = "serde", serde(default))]
  #[cfg_attr(feature = "serde", serde(skip_serializing_if = "Option::is_none"))]
  #[cfg_attr(feature = "serde", serde(deserialize_with = "deserialize_optional"))]
  pub email: Option<Option<String>>,
  pub best_score: u32,
  pub best_level: u32,
  pub has_carrot: bool,
  pub season_score: u32,
  pub rank: u8,
  // TODO: limit 0 <= r <= 4
  pub hall_of_fame: Option<HammerfestHallOfFameMessage>,
  pub items: HashSet<HammerfestItemId>,
  // TODO: limit size <= 1000
  pub quests: HashMap<HammerfestQuestId, HammerfestQuestStatus>, // TODO: limit size <= 100
}

declare_decimal_id! {
  pub struct HammerfestQuestId(u32);
  pub type ParseError = HammerfestQuestIdParseError;
  const BOUNDS = 0..1_000_000_000;
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum HammerfestQuestStatus {
  None,
  Pending,
  Complete,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestHallOfFameMessage {
  pub date: Instant,
  pub message: String,
}

declare_decimal_id! {
  pub struct HammerfestItemId(u16);
  pub type ParseError = HammerfestItemIdParseError;
  const BOUNDS = 0..10_000;
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestGodChild {
  pub user: ShortHammerfestUser,
  pub tokens: u32,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestShop {
  pub tokens: u32,
  pub weekly_tokens: u32,
  pub purchased_tokens: Option<u32>,
  pub has_quest_bonus: bool,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumDate {
  pub month: u8,
  // TODO: limit 1 <= m <= 12
  pub day: u8,
  // TODO: limit 1 <= d <= 31
  pub weekday: u8,
  // TODO: limit 1 <= w <= 7
  pub hour: u8,
  // TODO: limit 0 <= h <= 23
  pub minute: u8, // TODO: limit 0 <= m <= 59
}

declare_decimal_id! {
  pub struct HammerfestForumThemeId(u8);
  pub type ParseError = HammerfestForumThemeIdParseError;
  const BOUNDS = 0..100;
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortHammerfestForumTheme {
  pub server: HammerfestServer,
  pub id: HammerfestForumThemeId,
  pub name: String,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumTheme {
  #[cfg_attr(feature = "serde", serde(flatten))]
  pub short: ShortHammerfestForumTheme,
  pub description: String,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumThemePage {
  pub theme: ShortHammerfestForumTheme,
  pub sticky: Vec<HammerfestForumThread>,
  // TODO: limit size <= 15
  pub threads: HammerfestForumThreadListing,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumThreadListing {
  pub page1: u32,
  pub pages: u32,
  pub items: Vec<HammerfestForumThread>, // TODO: limit size <= 15
}

declare_decimal_id! {
  pub struct HammerfestForumThreadId(u32);
  pub type ParseError = HammerfestForumThreadIdParseError;
  const BOUNDS = 0..1_000_000_000;
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortHammerfestForumThread {
  pub server: HammerfestServer,
  pub id: HammerfestForumThreadId,
  pub name: String,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumThread {
  #[cfg_attr(feature = "serde", serde(flatten))]
  pub short: ShortHammerfestForumThread,
  pub author: ShortHammerfestUser,
  pub last_message_date: HammerfestForumDate,
  pub reply_count: u32,
  pub is_sticky: bool,
  pub is_closed: bool,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumThreadPage {
  pub theme: ShortHammerfestForumTheme,
  pub thread: ShortHammerfestForumThread,
  pub messages: HammerfestForumPostListing,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumPostListing {
  pub page1: u32,
  pub pages: u32,
  pub items: Vec<HammerfestForumPost>, // TODO: limit size <= 15
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumPostId(String);

impl HammerfestForumPostId {
  pub const PATTERN: Lazy<Regex> = Lazy::new(|| Regex::new(r"^[0-9]{1,9}$").unwrap());

  pub fn try_from_string(raw: String) -> Result<Self, ()> {
    if Self::PATTERN.is_match(&raw) {
      Ok(Self(raw))
    } else {
      Err(())
    }
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumPost {
  pub id: Option<HammerfestForumPostId>,
  pub author: HammerfestForumPostAuthor,
  pub ctime: HammerfestForumDate,
  pub content: String, // TODO: HtmlText?
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumPostAuthor {
  #[cfg_attr(feature = "serde", serde(flatten))]
  pub user: ShortHammerfestUser,
  pub has_carrot: bool,
  pub rank: u8,
  // TODO: limit 0 <= r <= 4
  pub role: HammerfestForumRole,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum HammerfestForumRole {
  None,
  Moderator,
  Administrator,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetHammerfestUserOptions {
  pub server: HammerfestServer,
  pub id: HammerfestUserId,
  pub time: Option<Instant>,
}

#[cfg(feature = "serde")]
fn deserialize_optional<'de, T, D>(deserializer: D) -> Result<Option<Option<T>>, D::Error>
where
  T: Deserialize<'de>,
  D: serde::Deserializer<'de>,
{
  Ok(Some(Option::deserialize(deserializer)?))
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait HammerfestClient: Send + Sync {
  async fn create_session(&self, options: &HammerfestCredentials) -> Result<HammerfestSession, Box<dyn Error>>;

  async fn test_session(
    &self,
    server: HammerfestServer,
    key: &HammerfestSessionKey,
  ) -> Result<Option<HammerfestSession>, Box<dyn Error>>;

  async fn get_profile_by_id(
    &self,
    session: Option<&HammerfestSession>,
    options: &HammerfestGetProfileByIdOptions,
  ) -> Result<Option<HammerfestProfile>, Box<dyn Error>>;

  async fn get_own_items(&self, session: &HammerfestSession) -> Result<HashMap<HammerfestItemId, u32>, Box<dyn Error>>;

  async fn get_own_god_children(&self, session: &HammerfestSession) -> Result<Vec<HammerfestGodChild>, Box<dyn Error>>;

  async fn get_own_shop(&self, session: &HammerfestSession) -> Result<HammerfestShop, Box<dyn Error>>;

  async fn get_forum_themes(
    &self,
    session: Option<&HammerfestSession>,
    server: HammerfestServer,
  ) -> Result<Vec<HammerfestForumTheme>, Box<dyn Error>>;

  async fn get_forum_theme_page(
    &self,
    session: Option<&HammerfestSession>,
    server: HammerfestServer,
    theme_id: HammerfestForumThemeId,
    page1: u32,
  ) -> Result<HammerfestForumThemePage, Box<dyn Error>>;

  async fn get_forum_thread_page(
    &self,
    session: Option<&HammerfestSession>,
    server: HammerfestServer,
    thread_id: HammerfestForumThreadId,
    page1: u32,
  ) -> Result<HammerfestForumThreadPage, Box<dyn Error>>;
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait HammerfestStore: Send + Sync {
  async fn get_short_user(
    &self,
    options: &GetHammerfestUserOptions,
  ) -> Result<Option<ShortHammerfestUser>, Box<dyn Error>>;

  async fn get_user(
    &self,
    options: &GetHammerfestUserOptions,
  ) -> Result<Option<ArchivedHammerfestUser>, Box<dyn Error>>;

  async fn touch_short_user(&self, options: &ShortHammerfestUser) -> Result<ArchivedHammerfestUser, Box<dyn Error>>;
}
