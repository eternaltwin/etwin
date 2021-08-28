use crate::core::Instant;
use crate::oauth::RfcOauthAccessTokenKey;
use crate::types::EtwinError;
use async_trait::async_trait;
use auto_impl::auto_impl;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};

declare_decimal_id! {
  pub struct TwinoidUserId(u32);
  pub type ParseError = TwinoidUserIdParseError;
  const BOUNDS = 1..1_000_000_000;
  const SQL_NAME = "twinoid_user_id";
}

impl TwinoidUserId {
  pub fn as_ref(self) -> TwinoidUserIdRef {
    TwinoidUserIdRef { id: self }
  }
}

declare_new_string! {
  pub struct TwinoidUserDisplayName(String);
  pub type ParseError = TwinoidUserDisplayNameParseError;
  const PATTERN = r"^.{1,100}$";
  const SQL_NAME = "twinoid_user_display_name";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "TwinoidUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortTwinoidUser {
  pub id: TwinoidUserId,
  pub display_name: TwinoidUserDisplayName,
}

impl From<ArchivedTwinoidUser> for ShortTwinoidUser {
  fn from(value: ArchivedTwinoidUser) -> Self {
    Self {
      id: value.id,
      display_name: value.display_name,
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "TwinoidUser"))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TwinoidUserIdRef {
  pub id: TwinoidUserId,
}

impl From<TwinoidUserId> for TwinoidUserIdRef {
  fn from(id: TwinoidUserId) -> Self {
    Self { id }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "TwinoidUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ArchivedTwinoidUser {
  pub id: TwinoidUserId,
  pub archived_at: Instant,
  pub display_name: TwinoidUserDisplayName,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetTwinoidUserOptions {
  pub id: TwinoidUserId,
  pub time: Option<Instant>,
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait TwinoidStore: Send + Sync {
  async fn get_short_user(&self, options: &GetTwinoidUserOptions) -> Result<Option<ShortTwinoidUser>, EtwinError>;

  async fn get_user(&self, options: &GetTwinoidUserOptions) -> Result<Option<ArchivedTwinoidUser>, EtwinError>;

  async fn touch_short_user(&self, options: &ShortTwinoidUser) -> Result<ArchivedTwinoidUser, EtwinError>;
}

// #[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum TwinoidApiAuth {
  Guest,
  Token(RfcOauthAccessTokenKey),
}

pub mod api {
  use crate::core::HtmlFragment;
  use crate::twinoid::TwinoidUserDisplayName;
  #[cfg(feature = "_serde")]
  use etwin_serde_tools::Deserialize;
  #[cfg(feature = "_serde")]
  use serde::de::DeserializeOwned;

  #[cfg(not(feature = "_serde"))]
  pub trait UserLike {}

  #[cfg(feature = "_serde")]
  pub trait UserLike: DeserializeOwned {}

  pub trait UserQuery: Send + Sync {
    type Output: UserLike;
    type Fields: AsRef<str>;
    // https://twinoid.com/graph/user/38?fields=id,name,picture,title,like,contacts.fields(user.fields(name,contacts))
    fn to_fields(&self) -> Self::Fields;
  }

  #[cfg_attr(feature = "_serde", derive(Deserialize))]
  #[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
  pub struct User<Name, Title> {
    id: u32,
    name: Name,
    title: Title,
  }

  #[cfg(not(feature = "_serde"))]
  impl<Name, Title> UserLike for User<Name, Title> {}

  #[cfg(feature = "_serde")]
  impl<Name: DeserializeOwned, Title: DeserializeOwned> UserLike for User<Name, Title> {}

  #[derive(Debug)]
  pub struct ConstUserQuery<const NAME: bool, const TITLE: bool>;

  impl UserQuery for ConstUserQuery<false, false> {
    type Output = User<(), ()>;
    type Fields = &'static str;

    fn to_fields(&self) -> Self::Fields {
      "id"
    }
  }

  impl UserQuery for ConstUserQuery<false, true> {
    type Output = User<(), HtmlFragment>;
    type Fields = &'static str;

    fn to_fields(&self) -> Self::Fields {
      "id,title"
    }
  }

  impl UserQuery for ConstUserQuery<true, false> {
    type Output = User<TwinoidUserDisplayName, ()>;
    type Fields = &'static str;

    fn to_fields(&self) -> Self::Fields {
      "id,name"
    }
  }

  impl UserQuery for ConstUserQuery<true, true> {
    type Output = User<TwinoidUserDisplayName, HtmlFragment>;
    type Fields = &'static str;

    fn to_fields(&self) -> Self::Fields {
      "id,name,title"
    }
  }
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait TwinoidClient: Send + Sync {
  async fn get_me<Query: api::UserQuery>(
    &self,
    auth: TwinoidApiAuth,
    query: &Query,
  ) -> Result<Query::Output, EtwinError>;
}
