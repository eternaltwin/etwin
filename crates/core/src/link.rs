use crate::core::{Instant, RawUserDot, UserDot};
use crate::dinoparc::DinoparcUserIdRef;
use crate::hammerfest::HammerfestUserIdRef;
use crate::twinoid::TwinoidUserIdRef;
use crate::types::EtwinError;
use crate::user::{ShortUser, UserIdRef};
use async_trait::async_trait;
use auto_impl::auto_impl;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};
use std::error::Error;
use std::fmt;
use thiserror::Error;

#[cfg(feature = "_serde")]
pub trait RemoteUserIdRef: Clone + PartialEq + Eq + fmt::Debug + Serialize + for<'a> Deserialize<'a> {}
#[cfg(not(feature = "_serde"))]
pub trait RemoteUserIdRef: Clone + PartialEq + Eq + fmt::Debug {}

impl RemoteUserIdRef for DinoparcUserIdRef {}
impl RemoteUserIdRef for HammerfestUserIdRef {}
impl RemoteUserIdRef for TwinoidUserIdRef {}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawLink<T: RemoteUserIdRef> {
  pub link: RawUserDot,
  pub unlink: (),
  pub etwin: UserIdRef,
  #[cfg_attr(feature = "_serde", serde(bound(deserialize = "T: RemoteUserIdRef")))]
  pub remote: T,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct OldRawLink<T: RemoteUserIdRef> {
  pub link: RawUserDot,
  pub unlink: RawUserDot,
  pub etwin: UserIdRef,
  #[cfg_attr(feature = "_serde", serde(bound(deserialize = "T: RemoteUserIdRef")))]
  pub remote: T,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct VersionedRawLink<T: RemoteUserIdRef> {
  #[cfg_attr(feature = "_serde", serde(bound(deserialize = "T: RemoteUserIdRef")))]
  pub current: Option<RawLink<T>>,
  #[cfg_attr(feature = "_serde", serde(bound(deserialize = "T: RemoteUserIdRef")))]
  pub old: Vec<OldRawLink<T>>,
}

impl<T: RemoteUserIdRef> Default for VersionedRawLink<T> {
  fn default() -> Self {
    Self {
      current: None,
      old: vec![],
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct VersionedRawLinks {
  pub dinoparc_com: VersionedRawLink<DinoparcUserIdRef>,
  pub en_dinoparc_com: VersionedRawLink<DinoparcUserIdRef>,
  pub hammerfest_es: VersionedRawLink<HammerfestUserIdRef>,
  pub hammerfest_fr: VersionedRawLink<HammerfestUserIdRef>,
  pub hfest_net: VersionedRawLink<HammerfestUserIdRef>,
  pub sp_dinoparc_com: VersionedRawLink<DinoparcUserIdRef>,
  pub twinoid: VersionedRawLink<TwinoidUserIdRef>,
}

impl Default for VersionedRawLinks {
  fn default() -> Self {
    Self {
      dinoparc_com: VersionedRawLink {
        current: None,
        old: vec![],
      },
      en_dinoparc_com: VersionedRawLink {
        current: None,
        old: vec![],
      },
      hammerfest_es: VersionedRawLink {
        current: None,
        old: vec![],
      },
      hammerfest_fr: VersionedRawLink {
        current: None,
        old: vec![],
      },
      hfest_net: VersionedRawLink {
        current: None,
        old: vec![],
      },
      sp_dinoparc_com: VersionedRawLink {
        current: None,
        old: vec![],
      },
      twinoid: VersionedRawLink {
        current: None,
        old: vec![],
      },
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TouchLinkOptions<T: RemoteUserIdRef> {
  pub etwin: UserIdRef,
  #[cfg_attr(feature = "_serde", serde(bound(deserialize = "T: RemoteUserIdRef")))]
  pub remote: T,
  pub linked_by: UserIdRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DeleteLinkOptions<T: RemoteUserIdRef> {
  pub etwin: UserIdRef,
  #[cfg_attr(feature = "_serde", serde(bound(deserialize = "T: RemoteUserIdRef")))]
  pub remote: T,
  pub unlinked_by: UserIdRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct EtwinLink {
  pub link: UserDot,
  pub unlink: (),
  #[cfg_attr(feature = "_serde", serde(rename = "user"))]
  pub etwin: ShortUser,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct OldEtwinLink {
  pub link: UserDot,
  pub unlink: UserDot,
  #[cfg_attr(feature = "_serde", serde(rename = "user"))]
  pub etwin: ShortUser,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Default, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct VersionedEtwinLink {
  pub current: Option<EtwinLink>,
  pub old: Vec<OldEtwinLink>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetLinkOptions<T: RemoteUserIdRef> {
  #[cfg_attr(feature = "_serde", serde(bound(deserialize = "T: RemoteUserIdRef")))]
  pub remote: T,
  pub time: Option<Instant>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetLinksFromEtwinOptions {
  pub etwin: UserIdRef,
  pub time: Option<Instant>,
}

#[derive(Error, Debug)]
pub enum TouchLinkError<T: RemoteUserIdRef> {
  #[error("cannot link as the remote user is already linked to the etwin user {0:?}")]
  ConflictEtwin(UserIdRef),
  #[error("cannot link as the etwin user is already linked to the remote user {0:?}")]
  ConflictRemote(T),
  #[error("cannot link as the remote user is already linked to the etwin user {0:?} and the etwin user is already linked to the remote user {1:?}")]
  ConflictBoth(UserIdRef, T),
  #[error(transparent)]
  Other(EtwinError),
}

impl<T: RemoteUserIdRef> TouchLinkError<T> {
  pub fn other<E: Error + Send + Sync + 'static>(e: E) -> Self {
    Self::Other(Box::new(e))
  }
}

#[derive(Error, Debug)]
pub enum DeleteLinkError<T: RemoteUserIdRef> {
  #[error("link not found for the etwin user {0:?} and remote {1:?}")]
  NotFound(UserIdRef, T),
  #[error(transparent)]
  Other(EtwinError),
}

impl<T: RemoteUserIdRef> DeleteLinkError<T> {
  pub fn other<E: Error + Send + Sync + 'static>(e: E) -> Self {
    Self::Other(Box::new(e))
  }
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait LinkStore: Send + Sync {
  async fn touch_dinoparc_link(
    &self,
    options: &TouchLinkOptions<DinoparcUserIdRef>,
  ) -> Result<VersionedRawLink<DinoparcUserIdRef>, TouchLinkError<DinoparcUserIdRef>>;

  async fn touch_hammerfest_link(
    &self,
    options: &TouchLinkOptions<HammerfestUserIdRef>,
  ) -> Result<VersionedRawLink<HammerfestUserIdRef>, TouchLinkError<HammerfestUserIdRef>>;

  async fn touch_twinoid_link(
    &self,
    options: &TouchLinkOptions<TwinoidUserIdRef>,
  ) -> Result<VersionedRawLink<TwinoidUserIdRef>, TouchLinkError<TwinoidUserIdRef>>;

  async fn delete_dinoparc_link(
    &self,
    options: &DeleteLinkOptions<DinoparcUserIdRef>,
  ) -> Result<VersionedRawLink<DinoparcUserIdRef>, DeleteLinkError<DinoparcUserIdRef>>;

  async fn delete_hammerfest_link(
    &self,
    options: &DeleteLinkOptions<HammerfestUserIdRef>,
  ) -> Result<VersionedRawLink<HammerfestUserIdRef>, DeleteLinkError<HammerfestUserIdRef>>;

  async fn delete_twinoid_link(
    &self,
    options: &DeleteLinkOptions<TwinoidUserIdRef>,
  ) -> Result<VersionedRawLink<TwinoidUserIdRef>, DeleteLinkError<TwinoidUserIdRef>>;

  async fn get_link_from_dinoparc(
    &self,
    options: &GetLinkOptions<DinoparcUserIdRef>,
  ) -> Result<VersionedRawLink<DinoparcUserIdRef>, EtwinError>;

  async fn get_link_from_hammerfest(
    &self,
    options: &GetLinkOptions<HammerfestUserIdRef>,
  ) -> Result<VersionedRawLink<HammerfestUserIdRef>, EtwinError>;

  async fn get_link_from_twinoid(
    &self,
    options: &GetLinkOptions<TwinoidUserIdRef>,
  ) -> Result<VersionedRawLink<TwinoidUserIdRef>, EtwinError>;

  async fn get_links_from_etwin(&self, options: &GetLinksFromEtwinOptions) -> Result<VersionedRawLinks, EtwinError>;
}
