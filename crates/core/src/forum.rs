use crate::core::{HtmlFragment, Instant, Listing, ListingCount, LocaleId};
use crate::oauth::{OauthClientIdRef, ShortOauthClient};
use crate::types::AnyError;
use crate::user::{ShortUser, UserIdRef, UserRef};
use async_trait::async_trait;
use auto_impl::auto_impl;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};
use thiserror::Error;

pub type MarktwinText = String;

declare_new_uuid! {
  pub struct ForumSectionId(Uuid);
  pub type ParseError = ForumSectionIdParseError;
  const SQL_NAME = "forum_section_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumSection"))]
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumSectionIdRef {
  pub id: ForumSectionId,
}

impl ForumSectionIdRef {
  pub const fn new(id: ForumSectionId) -> Self {
    Self { id }
  }
}

impl From<ForumSectionId> for ForumSectionIdRef {
  fn from(id: ForumSectionId) -> Self {
    Self::new(id)
  }
}

declare_new_string! {
  pub struct ForumSectionKey(String);
  pub type ParseError = ForumSectionKeyParseError;
  const PATTERN = r"^[_a-z][_a-z0-9]{0,31}$";
  const SQL_NAME = "forum_section_key";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumSection"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumSectionKeyRef {
  pub key: ForumSectionKey,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize), serde(untagged))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum ForumSectionRef {
  Id(ForumSectionIdRef),
  Key(ForumSectionKeyRef),
}

impl ForumSectionRef {
  pub const fn split(&self) -> (Option<ForumSectionIdRef>, Option<&ForumSectionKeyRef>) {
    let mut id: Option<ForumSectionIdRef> = None;
    let mut key: Option<&ForumSectionKeyRef> = None;
    match self {
      Self::Id(r) => id = Some(*r),
      Self::Key(r) => key = Some(r),
    };
    (id, key)
  }

  pub const fn split_deref(&self) -> (Option<ForumSectionId>, Option<&ForumSectionKey>) {
    let mut id: Option<ForumSectionId> = None;
    let mut key: Option<&ForumSectionKey> = None;
    match self {
      Self::Id(r) => id = Some(r.id),
      Self::Key(r) => key = Some(&r.key),
    };
    (id, key)
  }
}

impl From<&'_ ForumSection> for ForumSectionRef {
  fn from(section: &ForumSection) -> Self {
    Self::Id(section.as_ref())
  }
}

impl From<ForumSectionIdRef> for ForumSectionRef {
  fn from(r: ForumSectionIdRef) -> Self {
    Self::Id(r)
  }
}

impl From<ForumSectionKeyRef> for ForumSectionRef {
  fn from(r: ForumSectionKeyRef) -> Self {
    Self::Key(r)
  }
}

declare_new_uuid! {
  pub struct ForumThreadId(Uuid);
  pub type ParseError = ForumThreadIdParseError;
  const SQL_NAME = "forum_thread_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumThread"))]
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumThreadIdRef {
  pub id: ForumThreadId,
}

impl ForumThreadIdRef {
  pub const fn new(id: ForumThreadId) -> Self {
    Self { id }
  }
}

impl From<ForumThreadId> for ForumThreadIdRef {
  fn from(id: ForumThreadId) -> Self {
    Self::new(id)
  }
}

declare_new_string! {
  pub struct ForumThreadKey(String);
  pub type ParseError = ForumThreadKeyParseError;
  const PATTERN = r"^[_a-z][_a-z0-9]{0,31}$";
  const SQL_NAME = "forum_thread_key";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumThread"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumThreadKeyRef {
  pub key: ForumThreadKey,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize), serde(untagged))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum ForumThreadRef {
  Id(ForumThreadIdRef),
  Key(ForumThreadKeyRef),
}

declare_new_enum!(
  pub enum ForumRole {
    #[str("Administrator")]
    Administrator,
    #[str("Moderator")]
    Moderator,
  }
  pub type ParseError = ForumRoleParseError;
  const SQL_NAME = "forum_role";
);

declare_new_string! {
  pub struct ForumSectionDisplayName(String);
  pub type ParseError = ForumSectionDisplayNameParseError;
  const PATTERN = r"^\S.{0,62}\S$";
  const SQL_NAME = "forum_section_display_name";
}

declare_new_string! {
  pub struct ForumThreadTitle(String);
  pub type ParseError = ForumThreadTitleParseError;
  const PATTERN = r"^\S.{0,62}\S$";
  const SQL_NAME = "forum_thread_title";
}

declare_new_uuid! {
  pub struct ForumPostId(Uuid);
  pub type ParseError = ForumPostIdParseError;
  const SQL_NAME = "forum_post_id";
}

declare_new_uuid! {
  pub struct ForumPostRevisionId(Uuid);
  pub type ParseError = ForumPostRevisionIdParseError;
  const SQL_NAME = "forum_post_revision_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumSection"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumSection {
  pub id: ForumSectionId,
  pub key: Option<ForumSectionKey>,
  pub display_name: ForumSectionDisplayName,
  pub ctime: Instant,
  pub locale: Option<LocaleId>,
  pub threads: ForumThreadListing,
  pub role_grants: Vec<ForumRoleGrant>,
  #[cfg_attr(feature = "_serde", serde(rename = "self"))]
  pub this: ForumSectionSelf,
}

impl ForumSection {
  pub fn as_ref(&self) -> ForumSectionIdRef {
    ForumSectionIdRef { id: self.id }
  }
}

pub type ForumSectionListing = Listing<ForumSectionMeta>;

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumSection"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumSectionMeta {
  pub id: ForumSectionId,
  pub key: Option<ForumSectionKey>,
  pub display_name: ForumSectionDisplayName,
  pub ctime: Instant,
  pub locale: Option<LocaleId>,
  pub threads: ListingCount,
  #[cfg_attr(feature = "_serde", serde(rename = "self"))]
  pub this: ForumSectionSelf,
}

impl ForumSectionMeta {
  pub const fn as_ref(&self) -> ForumSectionIdRef {
    ForumSectionIdRef::new(self.id)
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumSection"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawForumSectionMeta {
  pub id: ForumSectionId,
  pub key: Option<ForumSectionKey>,
  pub display_name: ForumSectionDisplayName,
  pub ctime: Instant,
  pub locale: Option<LocaleId>,
  pub threads: ListingCount,
  pub role_grants: Vec<RawForumRoleGrant>,
}

impl RawForumSectionMeta {
  pub const fn as_ref(&self) -> ForumSectionIdRef {
    ForumSectionIdRef::new(self.id)
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumSectionSelf {
  pub roles: Vec<ForumRole>,
}

pub type ForumThreadListing = Listing<ForumThreadMeta>;

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumRoleGrant {
  pub role: ForumRole,
  pub user: ShortUser,
  pub start_time: Instant,
  pub granted_by: ShortUser,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawForumRoleGrant {
  pub role: ForumRole,
  pub user: UserIdRef,
  pub start_time: Instant,
  pub granted_by: UserIdRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumThread"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumThread {
  pub id: ForumThreadId,
  pub key: Option<ForumThreadKey>,
  pub title: ForumThreadTitle,
  pub ctime: Instant,
  pub section: ForumSectionMeta,
  pub posts: ForumPostListing,
  pub is_pinned: bool,
  pub is_locked: bool,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumThread"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumThreadMeta {
  pub id: ForumThreadId,
  pub key: Option<ForumThreadKey>,
  pub title: ForumThreadTitle,
  pub ctime: Instant,
  pub is_pinned: bool,
  pub is_locked: bool,
  pub posts: ListingCount,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumSection"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawCreateForumThreadResult {
  pub id: ForumThreadId,
  pub key: Option<ForumThreadKey>,
  pub title: ForumThreadTitle,
  pub section: ForumSectionIdRef,
  pub ctime: Instant,
  pub is_pinned: bool,
  pub is_locked: bool,
  pub post_id: ForumPostId,
  pub post_revision: RawForumPostRevision,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumThread"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumThreadMetaWithSection {
  pub id: ForumThreadId,
  pub key: Option<ForumThreadKey>,
  pub title: ForumThreadTitle,
  pub ctime: Instant,
  pub is_pinned: bool,
  pub is_locked: bool,
  pub posts: ListingCount,
  pub section: ForumSectionMeta,
}

pub type ForumPostListing = Listing<ShortForumPost>;

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumPost"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumPost {
  pub id: ForumPostId,
  pub ctime: Instant,
  pub author: ForumActor,
  pub revisions: LatestForumPostRevisionListing,
  pub thread: ForumThreadMetaWithSection,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumPost"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortForumPost {
  pub id: ForumPostId,
  pub ctime: Instant,
  pub author: ForumActor,
  pub revisions: LatestForumPostRevisionListing,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct LatestForumPostRevisionListing {
  pub count: u32,
  pub last: ForumPostRevision,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumPostRevision"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumPostRevision {
  pub id: ForumPostRevisionId,
  pub time: Instant,
  pub author: ForumActor,
  pub content: Option<ForumPostRevisionContent>,
  pub moderation: Option<ForumPostRevisionContent>,
  pub comment: Option<ForumPostRevisionComment>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "ForumPostRevision"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawForumPostRevision {
  pub id: ForumPostRevisionId,
  pub time: Instant,
  pub author: RawForumActor,
  pub content: Option<ForumPostRevisionContent>,
  pub moderation: Option<ForumPostRevisionContent>,
  pub comment: Option<ForumPostRevisionComment>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ForumPostRevisionContent {
  pub marktwin: MarktwinText,
  pub html: HtmlFragment,
}

declare_new_string! {
  pub struct ForumPostRevisionComment(String);
  pub type ParseError = ForumPostRevisionCommentParseError;
  const PATTERN = r".";
  const SQL_NAME = "forum_post_revision_comment";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum ForumActor {
  ClientForumActor(ClientForumActor),
  RoleForumActor(RoleForumActor),
  UserForumActor(UserForumActor),
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ClientForumActor {
  pub client: ShortOauthClient,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RoleForumActor {
  pub role: ForumRole,
  pub user: Option<ShortUser>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserForumActor {
  pub role: Option<ForumRole>,
  pub user: ShortUser,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum RawForumActor {
  ClientForumActor(RawClientForumActor),
  RoleForumActor(RawRoleForumActor),
  UserForumActor(RawUserForumActor),
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawClientForumActor {
  pub client: OauthClientIdRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawRoleForumActor {
  pub role: ForumRole,
  pub user: Option<UserIdRef>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawUserForumActor {
  pub role: Option<ForumRole>,
  pub user: UserIdRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct AddModeratorOptions {
  pub section: ForumSectionRef,
  pub user: UserRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawAddModeratorOptions {
  pub section: ForumSectionRef,
  pub grantee: UserIdRef,
  pub granter: UserIdRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DeleteModeratorOptions {
  pub section: ForumSectionRef,
  pub user: UserRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CreateThreadOptions {
  pub section: ForumSectionRef,
  pub title: ForumThreadTitle,
  pub body: MarktwinText,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawCreateThreadsOptions {
  pub actor: ForumActor,
  pub section: ForumSectionRef,
  pub title: ForumThreadTitle,
  pub body_mkt: MarktwinText,
  pub body_html: HtmlFragment,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UpsertSystemSectionOptions {
  pub key: ForumSectionKey,
  pub display_name: ForumSectionDisplayName,
  pub locale: Option<LocaleId>,
}

#[derive(Error, Debug)]
pub enum UpsertSystemSectionError {
  #[error(transparent)]
  Other(AnyError),
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetForumSectionOptions {
  pub section: ForumSectionRef,
  pub thread_offset: u32,
  pub thread_limit: u32,
}

#[derive(Error, Debug)]
pub enum GetSectionMetaError {
  #[error("section not found")]
  NotFound,
  #[error(transparent)]
  Other(AnyError),
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawGetThreadsOptions {
  pub section: ForumSectionRef,
  pub offset: u32,
  pub limit: u32,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawGetSectionsOptions {
  pub offset: u32,
  pub limit: u32,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawGetRoleGrantsOptions {
  pub section: ForumSectionIdRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CreatePostOptions {}

#[derive(Error, Debug)]
pub enum CreatePostError {
  #[error(transparent)]
  Other(AnyError),
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DeletePostOptions {}

#[derive(Error, Debug)]
pub enum DeletePostError {
  #[error(transparent)]
  Other(AnyError),
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetThreadOptions {}

#[derive(Error, Debug)]
pub enum GetThreadError {
  #[error(transparent)]
  Other(AnyError),
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait ForumStore: Send + Sync {
  async fn add_moderator(&self, options: &RawAddModeratorOptions) -> Result<(), AnyError>;

  async fn get_sections(&self, options: &RawGetSectionsOptions) -> Result<Listing<RawForumSectionMeta>, AnyError>;

  async fn get_section_meta(
    &self,
    options: &GetForumSectionOptions,
  ) -> Result<RawForumSectionMeta, GetSectionMetaError>;

  async fn get_threads(&self, options: &RawGetThreadsOptions) -> Result<ForumThreadListing, AnyError>;

  async fn create_thread(&self, options: &RawCreateThreadsOptions) -> Result<RawCreateForumThreadResult, AnyError>;

  async fn get_role_grants(&self, options: &RawGetRoleGrantsOptions) -> Result<Vec<ForumRoleGrant>, AnyError>;

  async fn upsert_system_section(
    &self,
    options: &UpsertSystemSectionOptions,
  ) -> Result<ForumSection, UpsertSystemSectionError>;
}
