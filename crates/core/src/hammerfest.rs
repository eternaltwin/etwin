use crate::core::Instant;
use crate::email::EmailAddress;
use crate::link::VersionedEtwinLink;
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
use std::convert::TryFrom;
use std::error::Error;
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
  pub fn as_ref(&self) -> HammerfestUserIdRef {
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
  pub ctime: Instant,
  pub atime: Instant,
  pub key: HammerfestSessionKey,
  pub user: ShortHammerfestUser,
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
pub struct HammerfestGodchild {
  pub user: ShortHammerfestUser,
  pub tokens: u32,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestShop {
  pub tokens: u32,
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
  fn decode(value: postgres::PgValueRef<'r>) -> Result<Self, Box<dyn Error + 'static + Send + Sync>> {
    let mut decoder = postgres::types::PgRecordDecoder::new(value)?;

    let month = decoder.try_decode::<i32>()?;
    let day = decoder.try_decode::<i32>()?;
    let weekday = decoder.try_decode::<i32>()?;

    // TODO: Proper error handling
    let month: u8 = u8::try_from(month).unwrap();
    let day: u8 = u8::try_from(day).unwrap();
    let weekday: u8 = u8::try_from(weekday).unwrap();

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
    postgres::PgTypeInfo::with_name("hammerfest_date_time")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info()
  }
}

#[cfg(feature = "sqlx")]
impl<'r> sqlx::Decode<'r, Postgres> for HammerfestDateTime {
  fn decode(value: postgres::PgValueRef<'r>) -> Result<Self, Box<dyn Error + 'static + Send + Sync>> {
    let mut decoder = postgres::types::PgRecordDecoder::new(value)?;

    let month = decoder.try_decode::<i32>()?;
    let day = decoder.try_decode::<i32>()?;
    let weekday = decoder.try_decode::<i32>()?;
    let hour = decoder.try_decode::<i32>()?;
    let minute = decoder.try_decode::<i32>()?;

    // TODO: Proper error handling
    let month: u8 = u8::try_from(month).unwrap();
    let day: u8 = u8::try_from(day).unwrap();
    let weekday: u8 = u8::try_from(weekday).unwrap();
    let hour: u8 = u8::try_from(hour).unwrap();
    let minute: u8 = u8::try_from(minute).unwrap();

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
    encoder.encode(i32::from(self.date.month));
    encoder.encode(i32::from(self.date.day));
    encoder.encode(i32::from(self.date.weekday));
    encoder.encode(i32::from(self.hour));
    encoder.encode(i32::from(self.minute));
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
  Regular { last_message_date: HammerfestDate },
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
pub struct HammerfestForumThreadPage {
  pub theme: ShortHammerfestForumTheme,
  pub thread: ShortHammerfestForumThread,
  pub messages: HammerfestForumPostListing,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumPostListing {
  pub page1: NonZeroU16,
  pub pages: NonZeroU16,
  pub items: Vec<HammerfestForumMessage>, // TODO: limit size <= 15
}

declare_decimal_id! {
  pub struct HammerfestForumMessageId(u32);
  pub type ParseError = HammerfestForumMessageIdParseError;
  const BOUNDS = 0..1_000_000_000;
  const SQL_NAME = "hammerfest_forum_message_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumMessage {
  pub id: Option<HammerfestForumMessageId>,
  pub author: HammerfestForumMessageAuthor,
  pub ctime: HammerfestDateTime,
  pub content: String, // TODO: HtmlText?
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct HammerfestForumMessageAuthor {
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

  async fn get_own_godchildren(&self, session: &HammerfestSession) -> Result<Vec<HammerfestGodchild>, Box<dyn Error>>;

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
    page1: NonZeroU16,
  ) -> Result<HammerfestForumThemePage, Box<dyn Error>>;

  async fn get_forum_thread_page(
    &self,
    session: Option<&HammerfestSession>,
    server: HammerfestServer,
    thread_id: HammerfestForumThreadId,
    page1: NonZeroU16,
  ) -> Result<HammerfestForumThreadPage, Box<dyn Error>>;
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait HammerfestStore: Send + Sync {
  async fn get_short_user(
    &self,
    options: &GetHammerfestUserOptions,
  ) -> Result<Option<ShortHammerfestUser>, Box<dyn Error>>;

  async fn get_user(&self, options: &GetHammerfestUserOptions) -> Result<Option<StoredHammerfestUser>, Box<dyn Error>>;

  async fn touch_short_user(&self, options: &ShortHammerfestUser) -> Result<StoredHammerfestUser, Box<dyn Error>>;

  async fn touch_shop(&self, user: &ShortHammerfestUser, options: &HammerfestShop) -> Result<(), Box<dyn Error>>;

  async fn touch_profile(&self, options: &HammerfestProfile) -> Result<(), Box<dyn Error>>;

  async fn touch_inventory(
    &self,
    user: &ShortHammerfestUser,
    inventory: &HashMap<HammerfestItemId, u32>,
  ) -> Result<(), Box<dyn Error>>;

  async fn touch_godchildren(
    &self,
    user: &ShortHammerfestUser,
    godchildren: &[HammerfestGodchild],
  ) -> Result<(), Box<dyn Error>>;

  async fn touch_theme_page(&self, options: &HammerfestForumThemePage) -> Result<(), Box<dyn Error>>;

  async fn touch_thread_page(&self, options: &HammerfestForumThreadPage) -> Result<(), Box<dyn Error>>;
}

pub fn hammerfest_reply_count_to_page_count(reply_count: u16) -> NonZeroU16 {
  let message_count = reply_count + 1;
  const MESSAGES_PER_PAGE: u16 = 15;
  let (q, r) = (message_count / MESSAGES_PER_PAGE, message_count % MESSAGES_PER_PAGE);
  let pages = if r == 0 { q } else { q + 1 };
  NonZeroU16::new(pages).unwrap()
}
