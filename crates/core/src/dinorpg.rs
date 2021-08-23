use crate::twinoid::TwinoidUserDisplayName;
use crate::types::EtwinError;
use async_trait::async_trait;
use auto_impl::auto_impl;
use enum_iterator::IntoEnumIterator;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, IntoEnumIterator)]
pub enum DinorpgServer {
  #[cfg_attr(feature = "_serde", serde(rename = "www.dinorpg.com"))]
  DinorpgCom,
  #[cfg_attr(feature = "_serde", serde(rename = "en.dinorpg.com"))]
  EnDinorpgCom,
  #[cfg_attr(feature = "_serde", serde(rename = "es.dinorpg.com"))]
  EsDinorpgCom,
}

declare_decimal_id! {
  pub struct DinorpgUserId(u32);
  pub type ParseError = DinorpgUserIdParseError;
  const BOUNDS = 0..1_000_000_000;
  const SQL_NAME = "dinorpg_user_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinorpgUser"))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinorpgUserIdRef {
  pub server: DinorpgServer,
  pub id: DinorpgUserId,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinorpgUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortDinorpgUser {
  pub server: DinorpgServer,
  pub id: DinorpgUserId,
  pub display_name: TwinoidUserDisplayName,
}

impl ShortDinorpgUser {
  pub const fn as_ref(&self) -> DinorpgUserIdRef {
    DinorpgUserIdRef {
      server: self.server,
      id: self.id,
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DinorpgProfileResponse {
  // pub session_user: Option<todo!()>,
  pub profile: DinorpgProfile,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DinorpgProfile {
  pub user: ShortDinorpgUser,
  // pub dinoz_count: ...,
  // pub clan: ...,
  // pub items: ...,
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait DinorpgClient: Send + Sync {
  async fn get_profile(&self, id: DinorpgUserIdRef) -> Result<DinorpgProfileResponse, EtwinError>;
}
