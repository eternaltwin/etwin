use crate::core::Instant;
use crate::email::EmailAddress;
use crate::link::VersionedEtwinLink;
use crate::types::EtwinError;
use async_trait::async_trait;
use auto_impl::auto_impl;
use enum_iterator::IntoEnumIterator;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{
  deserialize_nested_option, serialize_ordered_map, serialize_ordered_set, Deserialize, Serialize,
};
#[cfg(feature = "sqlx")]
use sqlx::{postgres, Postgres};
use std::collections::{HashMap, HashSet};
use std::iter::FusedIterator;
use std::num::NonZeroU16;

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
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

declare_new_enum!(
  #[derive(IntoEnumIterator)]
  pub enum HammerfestServer {
    #[str("hammerfest.fr")]
    HammerfestFr,
    #[str("hfest.net")]
    HfestNet,
    #[str("hammerfest.es")]
    HammerfestEs,
  }
  pub type ParseError = HammerfestServerParseError;
  const SQL_NAME = "hammerfest_server";
);

impl HammerfestServer {
  pub fn iter() -> impl Iterator<Item = Self> + ExactSizeIterator + FusedIterator + Copy {
    Self::into_enum_iter()
  }
}

declare_new_enum!(
  pub enum HammerfestQuestStatus {
    #[str("None")]
    None,
    #[str("Pending")]
    Pending,
    #[str("Complete")]
    Complete,
  }
  pub type ParseError = HammerfestQuestStatusParseError;
  const SQL_NAME = "hammerfest_quest_status";
);

declare_new_string! {
  pub struct HammerfestUsername(String);
  pub type ParseError = HammerfestUsernameParseError;
  const PATTERN = r"^[0-9A-Za-z]{1,12}$";
  const SQL_NAME = "hammerfest_username";
}

declare_decimal_id! {
  pub struct HammerfestUserId(u32);
  pub type ParseError = HammerfestUserIdParseError;
  const BOUNDS = 1..1_000_000_000;
  const SQL_NAME = "hammerfest_user_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "HammerfestUser"))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestUserIdRef {
  pub server: HammerfestServer,
  pub id: HammerfestUserId,
}

declare_new_string! {
  pub struct HammerfestSessionKey(String);
  pub type ParseError = HammerfestSessionKeyParseError;
  const PATTERN = r"^[0-9a-z]{26}$";
  const SQL_NAME = "hammerfest_session_key";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestCredentials {
  pub server: HammerfestServer,
  pub username: HammerfestUsername,
  pub password: HammerfestPassword,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "HammerfestUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortHammerfestUser {
  pub server: HammerfestServer,
  pub id: HammerfestUserId,
  pub username: HammerfestUsername,
}

impl ShortHammerfestUser {
  pub const fn as_ref(&self) -> HammerfestUserIdRef {
    HammerfestUserIdRef {
      server: self.server,
      id: self.id,
    }
  }
}

impl From<StoredHammerfestUser> for ShortHammerfestUser {
  fn from(value: StoredHammerfestUser) -> Self {
    Self {
      server: value.server,
      id: value.id,
      username: value.username,
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "HammerfestUser"))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct StoredHammerfestUser {
  pub server: HammerfestServer,
  pub id: HammerfestUserId,
  pub username: HammerfestUsername,
  pub archived_at: Instant,
  pub profile: Option<StoredHammerfestProfile>,
  pub items: Option<StoredHammerfestItems>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "HammerfestUser"))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct HammerfestUser {
  pub server: HammerfestServer,
  pub id: HammerfestUserId,
  pub username: HammerfestUsername,
  pub archived_at: Instant,
  pub profile: Option<StoredHammerfestProfile>,
  pub items: Option<StoredHammerfestItems>,
  pub etwin: VersionedEtwinLink,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct StoredHammerfestProfile {
  pub first_archived_at: Instant,
  pub last_archived_at: Instant,
  pub best_score: u32,
  pub best_level: u32,
  pub game_completed: bool,
  pub items: HashMap<HammerfestItemId, bool>,
  pub quests: HashMap<HammerfestQuestId, HammerfestQuestStatus>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct StoredHammerfestItems {
  pub first_archived_at: Instant,
  pub last_archived_at: Instant,
  pub items: HashMap<HammerfestItemId, u32>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestSession {
  pub key: HammerfestSessionKey,
  pub user: ShortHammerfestUser,
  pub ctime: Instant,
  pub atime: Instant,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct StoredHammerfestSession {
  pub key: HammerfestSessionKey,
  pub user: HammerfestUserIdRef,
  pub ctime: Instant,
  pub atime: Instant,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestGetProfileByIdOptions {
  pub server: HammerfestServer,
  pub user_id: HammerfestUserId,
}

declare_new_int! {
  pub struct HammerfestLadderLevel(u8);
  pub type RangeError = HammerfestLadderLevelRangeError;
  const BOUNDS = 0..=4;
  type SqlType = i16;
  const SQL_NAME = "hammerfest_ladder_level";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct HammerfestProfileResponse {
  pub session_user: Option<HammerfestSessionUser>,
  pub profile: HammerfestProfile,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct HammerfestProfile {
  pub user: ShortHammerfestUser,
  /// Email address as displayed on the profile
  ///
  /// `None`: Missing authorization to view the email
  /// `Some(None)`: No email
  /// `Some(Some(_))`: Email address
  #[cfg_attr(feature = "_serde", serde(skip_serializing_if = "Option::is_none"))]
  #[cfg_attr(feature = "_serde", serde(default, deserialize_with = "deserialize_nested_option"))]
  pub email: Option<Option<EmailAddress>>,
  pub best_score: u32,
  pub best_level: u8,
  pub has_carrot: bool,
  pub season_score: u32,
  pub ladder_level: HammerfestLadderLevel,
  pub hall_of_fame: Option<HammerfestHallOfFameMessage>,
  // TODO: limit size <= 1000
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_ordered_set"))]
  pub items: HashSet<HammerfestItemId>,
  // TODO: limit size <= 100
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_ordered_map"))]
  pub quests: HashMap<HammerfestQuestId, HammerfestQuestStatus>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct HammerfestInventoryResponse {
  pub session_user: HammerfestSessionUser,
  pub inventory: HashMap<HammerfestItemId, u32>,
}

declare_decimal_id! {
  pub struct HammerfestQuestId(u8);
  pub type ParseError = HammerfestQuestIdParseError;
  const BOUNDS = 0..76;
  const SQL_NAME = "hammerfest_quest_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestHallOfFameMessage {
  pub date: Instant,
  pub message: String,
}

declare_decimal_id! {
  pub struct HammerfestItemId(u16);
  pub type ParseError = HammerfestItemIdParseError;
  const BOUNDS = 0..10_000;
  const SQL_NAME = "hammerfest_item_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestShopResponse {
  pub session_user: HammerfestSessionUser,
  pub shop: HammerfestShop,
}

/// Data in the top-bar for logged-in users
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestSessionUser {
  pub user: ShortHammerfestUser,
  pub tokens: u32,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestGodchild {
  pub user: ShortHammerfestUser,
  pub tokens: u32,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestGodchildrenResponse {
  pub session_user: HammerfestSessionUser,
  pub godchildren: Vec<HammerfestGodchild>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestShop {
  pub weekly_tokens: u8,
  // If `None`, the user completed all reward steps, meaning
  // they have bought at least 250 tokens.
  pub purchased_tokens: Option<u8>,
  pub has_quest_bonus: bool,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestDate {
  // TODO: limit 1 <= m <= 12
  pub month: u8,
  // TODO: limit 1 <= d <= 31
  pub day: u8,
  /// Day of the week from 1 (Monday) to 7 (Sunday)
  // TODO: limit 1 <= w <= 7
  pub weekday: u8,
}

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for HammerfestDate {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("hammerfest_date")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info()
  }
}

#[cfg(feature = "sqlx")]
impl<'r> sqlx::Decode<'r, Postgres> for HammerfestDate {
  fn decode(value: postgres::PgValueRef<'r>) -> Result<Self, Box<dyn std::error::Error + 'static + Send + Sync>> {
    let mut decoder = postgres::types::PgRecordDecoder::new(value)?;

    let month = decoder.try_decode::<crate::pg_num::PgU8>()?;
    let day = decoder.try_decode::<crate::pg_num::PgU8>()?;
    let weekday = decoder.try_decode::<crate::pg_num::PgU8>()?;

    let month: u8 = u8::from(month);
    let day: u8 = u8::from(day);
    let weekday: u8 = u8::from(weekday);

    Ok(Self { month, day, weekday })
  }
}

#[cfg(feature = "sqlx")]
impl<'q> sqlx::Encode<'q, Postgres> for HammerfestDate {
  fn encode_by_ref(&self, buf: &mut postgres::PgArgumentBuffer) -> sqlx::encode::IsNull {
    let mut encoder = postgres::types::PgRecordEncoder::new(buf);
    encoder.encode(crate::pg_num::PgU8::from(self.month));
    encoder.encode(crate::pg_num::PgU8::from(self.day));
    encoder.encode(crate::pg_num::PgU8::from(self.weekday));
    encoder.finish();
    sqlx::encode::IsNull::No
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestDateTime {
  #[cfg_attr(feature = "_serde", serde(flatten))]
  pub date: HammerfestDate,
  // TODO: limit 0 <= h <= 23
  pub hour: u8,
  // TODO: limit 0 <= m <= 59
  pub minute: u8,
}

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for HammerfestDateTime {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("hammerfest_datetime")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info()
  }
}

#[cfg(feature = "sqlx")]
impl<'r> sqlx::Decode<'r, Postgres> for HammerfestDateTime {
  fn decode(value: postgres::PgValueRef<'r>) -> Result<Self, Box<dyn std::error::Error + 'static + Send + Sync>> {
    let mut decoder = postgres::types::PgRecordDecoder::new(value)?;

    let month = decoder.try_decode::<crate::pg_num::PgU8>()?;
    let day = decoder.try_decode::<crate::pg_num::PgU8>()?;
    let weekday = decoder.try_decode::<crate::pg_num::PgU8>()?;
    let hour = decoder.try_decode::<crate::pg_num::PgU8>()?;
    let minute = decoder.try_decode::<crate::pg_num::PgU8>()?;

    let month: u8 = u8::from(month);
    let day: u8 = u8::from(day);
    let weekday: u8 = u8::from(weekday);
    let hour: u8 = u8::from(hour);
    let minute: u8 = u8::from(minute);

    Ok(Self {
      date: HammerfestDate { month, day, weekday },
      hour,
      minute,
    })
  }
}

#[cfg(feature = "sqlx")]
impl<'q> sqlx::Encode<'q, Postgres> for HammerfestDateTime {
  fn encode_by_ref(&self, buf: &mut postgres::PgArgumentBuffer) -> sqlx::encode::IsNull {
    let mut encoder = postgres::types::PgRecordEncoder::new(buf);
    encoder.encode(crate::pg_num::PgU8::from(self.date.month));
    encoder.encode(crate::pg_num::PgU8::from(self.date.day));
    encoder.encode(crate::pg_num::PgU8::from(self.date.weekday));
    encoder.encode(crate::pg_num::PgU8::from(self.hour));
    encoder.encode(crate::pg_num::PgU8::from(self.minute));
    encoder.finish();
    sqlx::encode::IsNull::No
  }
}

declare_decimal_id! {
  pub struct HammerfestForumThemeId(u8);
  pub type ParseError = HammerfestForumThemeIdParseError;
  const BOUNDS = 0..100;
  const SQL_NAME = "hammerfest_forum_theme_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "HammerfestUser"))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumThemeIdRef {
  pub server: HammerfestServer,
  pub id: HammerfestForumThemeId,
}

declare_new_string! {
  pub struct HammerfestForumThemeTitle(String);
  pub type ParseError = HammerfestForumThemeTitleParseError;
  const PATTERN = r"^.{1,100}$";
  const SQL_NAME = "hammerfest_forum_theme_title";
}

declare_new_string! {
  pub struct HammerfestForumThemeDescription(String);
  pub type ParseError = HammerfestForumThemeDescriptionParseError;
  const PATTERN = r"^.{1,500}$";
  const SQL_NAME = "hammerfest_forum_theme_description";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortHammerfestForumTheme {
  pub server: HammerfestServer,
  pub id: HammerfestForumThemeId,
  pub name: HammerfestForumThemeTitle,
  pub is_public: bool,
}

impl ShortHammerfestForumTheme {
  pub const fn as_ref(&self) -> HammerfestForumThemeIdRef {
    HammerfestForumThemeIdRef {
      server: self.server,
      id: self.id,
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumTheme {
  #[cfg_attr(feature = "_serde", serde(flatten))]
  pub short: ShortHammerfestForumTheme,
  pub description: HammerfestForumThemeDescription,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumThemePageResponse {
  pub session_user: Option<HammerfestSessionUser>,
  pub page: HammerfestForumThemePage,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumThemePage {
  pub theme: ShortHammerfestForumTheme,
  pub sticky: Vec<HammerfestForumThread>,
  // TODO: limit size <= 15
  pub threads: HammerfestForumThreadListing,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumThreadListing {
  pub page1: NonZeroU16,
  pub pages: NonZeroU16,
  pub items: Vec<HammerfestForumThread>, // TODO: limit size <= 15
}

declare_decimal_id! {
  pub struct HammerfestForumThreadId(u32);
  pub type ParseError = HammerfestForumThreadIdParseError;
  const BOUNDS = 0..1_000_000_000;
  const SQL_NAME = "hammerfest_forum_thread_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "HammerfestUser"))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumThreadIdRef {
  pub server: HammerfestServer,
  pub id: HammerfestForumThreadId,
}

declare_new_string! {
  pub struct HammerfestForumThreadTitle(String);
  pub type ParseError = HammerfestForumThreadTitleParseError;
  const PATTERN = r"^.{1,100}$";
  const SQL_NAME = "hammerfest_forum_thread_title";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortHammerfestForumThread {
  pub server: HammerfestServer,
  pub id: HammerfestForumThreadId,
  pub name: HammerfestForumThreadTitle,
  pub is_closed: bool,
}

impl ShortHammerfestForumThread {
  pub const fn as_ref(&self) -> HammerfestForumThreadIdRef {
    HammerfestForumThreadIdRef {
      server: self.server,
      id: self.id,
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[cfg_attr(feature = "_serde", serde(tag = "kind"))]
pub enum HammerfestForumThreadKind {
  #[cfg_attr(feature = "_serde", serde(rename = "sticky"))]
  Sticky,
  #[cfg_attr(feature = "_serde", serde(rename = "regular"))]
  Regular { latest_post_date: HammerfestDate },
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumThread {
  #[cfg_attr(feature = "_serde", serde(flatten))]
  pub short: ShortHammerfestForumThread,
  pub author: ShortHammerfestUser,
  pub author_role: HammerfestForumRole,
  #[cfg_attr(feature = "_serde", serde(flatten))]
  pub kind: HammerfestForumThreadKind,
  pub reply_count: u16,
}

impl HammerfestForumThread {
  pub const fn as_ref(&self) -> HammerfestForumThreadIdRef {
    self.short.as_ref()
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumThreadPageResponse {
  pub session_user: Option<HammerfestSessionUser>,
  pub page: HammerfestForumThreadPage,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumThreadPage {
  pub theme: ShortHammerfestForumTheme,
  pub thread: ShortHammerfestForumThread,
  pub posts: HammerfestForumPostListing,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumPostListing {
  pub page1: NonZeroU16,
  pub pages: NonZeroU16,
  pub items: Vec<HammerfestForumPost>, // TODO: limit size <= 15
}

declare_decimal_id! {
  pub struct HammerfestForumPostId(u32);
  pub type ParseError = HammerfestForumPostIdParseError;
  const BOUNDS = 0..1_000_000_000;
  const SQL_NAME = "hammerfest_forum_post_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumPost {
  pub id: Option<HammerfestForumPostId>,
  pub author: HammerfestForumPostAuthor,
  pub ctime: HammerfestDateTime,
  pub content: String, // TODO: HtmlText?
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumPostAuthor {
  #[cfg_attr(feature = "_serde", serde(flatten))]
  pub user: ShortHammerfestUser,
  pub has_carrot: bool,
  pub ladder_level: HammerfestLadderLevel,
  // Best rank in the highscore for the current ladder level, None for `--`
  pub rank: Option<u32>,
  pub role: HammerfestForumRole,
}

declare_new_enum!(
  pub enum HammerfestForumRole {
    #[str("None")]
    None,
    #[str("Moderator")]
    Moderator,
    #[str("Administrator")]
    Administrator,
  }
  pub type ParseError = HammerfestForumRoleParseError;
  const SQL_NAME = "hammerfest_forum_role";
);

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetHammerfestUserOptions {
  pub server: HammerfestServer,
  pub id: HammerfestUserId,
  pub time: Option<Instant>,
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait HammerfestClient: Send + Sync {
  async fn create_session(&self, options: &HammerfestCredentials) -> Result<HammerfestSession, EtwinError>;

  async fn test_session(
    &self,
    server: HammerfestServer,
    key: &HammerfestSessionKey,
  ) -> Result<Option<HammerfestSession>, EtwinError>;

  async fn get_profile_by_id(
    &self,
    session: Option<&HammerfestSession>,
    options: &HammerfestGetProfileByIdOptions,
  ) -> Result<Option<HammerfestProfile>, EtwinError>;

  async fn get_own_items(&self, session: &HammerfestSession) -> Result<HashMap<HammerfestItemId, u32>, EtwinError>;

  async fn get_own_godchildren(&self, session: &HammerfestSession) -> Result<Vec<HammerfestGodchild>, EtwinError>;

  async fn get_own_shop(&self, session: &HammerfestSession) -> Result<HammerfestShop, EtwinError>;

  async fn get_forum_themes(
    &self,
    session: Option<&HammerfestSession>,
    server: HammerfestServer,
  ) -> Result<Vec<HammerfestForumTheme>, EtwinError>;

  async fn get_forum_theme_page(
    &self,
    session: Option<&HammerfestSession>,
    server: HammerfestServer,
    theme_id: HammerfestForumThemeId,
    page1: NonZeroU16,
  ) -> Result<HammerfestForumThemePage, EtwinError>;

  async fn get_forum_thread_page(
    &self,
    session: Option<&HammerfestSession>,
    server: HammerfestServer,
    thread_id: HammerfestForumThreadId,
    page1: NonZeroU16,
  ) -> Result<HammerfestForumThreadPage, EtwinError>;
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait HammerfestStore: Send + Sync {
  async fn get_short_user(&self, options: &GetHammerfestUserOptions)
    -> Result<Option<ShortHammerfestUser>, EtwinError>;

  async fn get_user(&self, options: &GetHammerfestUserOptions) -> Result<Option<StoredHammerfestUser>, EtwinError>;

  async fn touch_short_user(&self, options: &ShortHammerfestUser) -> Result<StoredHammerfestUser, EtwinError>;

  async fn touch_shop(&self, response: &HammerfestShopResponse) -> Result<(), EtwinError>;

  async fn touch_profile(&self, response: &HammerfestProfileResponse) -> Result<(), EtwinError>;

  async fn touch_inventory(&self, response: &HammerfestInventoryResponse) -> Result<(), EtwinError>;

  async fn touch_godchildren(&self, response: &HammerfestGodchildrenResponse) -> Result<(), EtwinError>;

  async fn touch_theme_page(&self, response: &HammerfestForumThemePageResponse) -> Result<(), EtwinError>;

  async fn touch_thread_page(&self, response: &HammerfestForumThreadPageResponse) -> Result<(), EtwinError>;
}

pub fn hammerfest_reply_count_to_page_count(reply_count: u16) -> NonZeroU16 {
  let post_count = reply_count + 1;
  const POSTS_PER_PAGE: u16 = 15;
  let (q, r) = (post_count / POSTS_PER_PAGE, post_count % POSTS_PER_PAGE);
  let pages = if r == 0 { q } else { q + 1 };
  NonZeroU16::new(pages).unwrap()
}

#[cfg(test)]
mod test {
  use crate::hammerfest::{HammerfestServer, HammerfestUser, ShortHammerfestUser};
  use crate::link::VersionedEtwinLink;
  use chrono::{TimeZone, Utc};
  use std::fs;

  #[allow(clippy::unnecessary_wraps)]
  fn get_nullable_short_hammerfest_user_alice() -> Option<ShortHammerfestUser> {
    Some(ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
    })
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_nullable_short_hammerfest_user_alice() {
    let s = fs::read_to_string("../../test-resources/core/hammerfest/nullable-short-hammerfest-user/alice/value.json")
      .unwrap();
    let actual: Option<ShortHammerfestUser> = serde_json::from_str(&s).unwrap();
    let expected = get_nullable_short_hammerfest_user_alice();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_nullable_short_hammerfest_user_alice() {
    let value = get_nullable_short_hammerfest_user_alice();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected =
      fs::read_to_string("../../test-resources/core/hammerfest/nullable-short-hammerfest-user/alice/value.json")
        .unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_nullable_short_hammerfest_user_null() -> Option<ShortHammerfestUser> {
    None
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_nullable_short_hammerfest_user_null() {
    let s = fs::read_to_string("../../test-resources/core/hammerfest/nullable-short-hammerfest-user/null/value.json")
      .unwrap();
    let actual: Option<ShortHammerfestUser> = serde_json::from_str(&s).unwrap();
    let expected = get_nullable_short_hammerfest_user_null();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_nullable_short_hammerfest_user_null() {
    let value = get_nullable_short_hammerfest_user_null();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected =
      fs::read_to_string("../../test-resources/core/hammerfest/nullable-short-hammerfest-user/null/value.json")
        .unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_short_hammerfest_user_demurgos() -> ShortHammerfestUser {
    ShortHammerfestUser {
      server: HammerfestServer::HfestNet,
      id: "205769".parse().unwrap(),
      username: "Demurgos".parse().unwrap(),
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_short_hammerfest_user_demurgos() {
    let s =
      fs::read_to_string("../../test-resources/core/hammerfest/short-hammerfest-user/demurgos/value.json").unwrap();
    let actual: ShortHammerfestUser = serde_json::from_str(&s).unwrap();
    let expected = get_short_hammerfest_user_demurgos();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_short_hammerfest_user_demurgos() {
    let value = get_short_hammerfest_user_demurgos();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected =
      fs::read_to_string("../../test-resources/core/hammerfest/short-hammerfest-user/demurgos/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_short_hammerfest_user_elseabora() -> ShortHammerfestUser {
    ShortHammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "127".parse().unwrap(),
      username: "elseabora".parse().unwrap(),
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_short_hammerfest_user_elseabora() {
    let s =
      fs::read_to_string("../../test-resources/core/hammerfest/short-hammerfest-user/elseabora/value.json").unwrap();
    let actual: ShortHammerfestUser = serde_json::from_str(&s).unwrap();
    let expected = get_short_hammerfest_user_elseabora();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_short_hammerfest_user_elseabora() {
    let value = get_short_hammerfest_user_elseabora();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected =
      fs::read_to_string("../../test-resources/core/hammerfest/short-hammerfest-user/elseabora/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_hammerfest_user_alice() -> HammerfestUser {
    HammerfestUser {
      server: HammerfestServer::HammerfestFr,
      id: "123".parse().unwrap(),
      username: "alice".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms_milli(0, 0, 0, 1),
      profile: None,
      items: None,
      etwin: VersionedEtwinLink::default(),
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_hammerfest_user_alice() {
    let s = fs::read_to_string("../../test-resources/core/hammerfest/hammerfest-user/alice/value.json").unwrap();
    let actual: HammerfestUser = serde_json::from_str(&s).unwrap();
    let expected = get_hammerfest_user_alice();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_hammerfest_user_alice() {
    let value = get_hammerfest_user_alice();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/hammerfest/hammerfest-user/alice/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }
}
