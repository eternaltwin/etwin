use crate::core::{Instant, RawUserDot, UserDot};
use crate::dinoparc::{DinoparcServer, DinoparcUserId, DinoparcUserIdRef, ShortDinoparcUser};
use crate::hammerfest::{HammerfestServer, HammerfestUserId, HammerfestUserIdRef, ShortHammerfestUser};
use crate::twinoid::{ShortTwinoidUser, TwinoidUserId, TwinoidUserIdRef};
use crate::user::{ShortUser, UserId, UserIdRef};
use async_trait::async_trait;
#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fmt;
use thiserror::Error;

#[cfg(feature = "serde")]
pub trait RemoteUserIdRef: Clone + fmt::Debug + Serialize + for<'a> Deserialize<'a> {}
#[cfg(not(feature = "serde"))]
pub trait RemoteUserIdRef: Clone + fmt::Debug {}

impl RemoteUserIdRef for DinoparcUserIdRef {}
impl RemoteUserIdRef for HammerfestUserIdRef {}
impl RemoteUserIdRef for TwinoidUserIdRef {}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawLink<T: RemoteUserIdRef> {
  pub link: RawUserDot,
  pub unlink: (),
  pub etwin: UserIdRef,
  #[cfg_attr(feature = "serde", serde(bound(deserialize = "T: RemoteUserIdRef")))]
  pub remote: T,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct OldRawLink<T: RemoteUserIdRef> {
  pub link: RawUserDot,
  pub unlink: RawUserDot,
  pub etwin: UserIdRef,
  #[cfg_attr(feature = "serde", serde(bound(deserialize = "T: RemoteUserIdRef")))]
  pub remote: T,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct VersionedRawLink<T: RemoteUserIdRef> {
  #[cfg_attr(feature = "serde", serde(bound(deserialize = "T: RemoteUserIdRef")))]
  pub current: Option<RawLink<T>>,
  #[cfg_attr(feature = "serde", serde(bound(deserialize = "T: RemoteUserIdRef")))]
  pub old: Vec<OldRawLink<T>>,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct VersionedRawLinks {
  dinoparc_com: VersionedRawLink<DinoparcUserIdRef>,
  en_dinoparc_com: VersionedRawLink<DinoparcUserIdRef>,
  hammerfest_es: VersionedRawLink<HammerfestUserIdRef>,
  hammerfest_fr: VersionedRawLink<HammerfestUserIdRef>,
  hfest_net: VersionedRawLink<HammerfestUserIdRef>,
  sp_dinoparc_com: VersionedRawLink<DinoparcUserIdRef>,
  twinoid: VersionedRawLink<TwinoidUserIdRef>,
}

struct DinoparcLink {
  link: UserDot,
  user: ShortDinoparcUser,
}

struct OldDinoparcLink {
  link: UserDot,
  unlink: UserDot,
  user: ShortDinoparcUser,
}

struct VersionedDinoparcLink {
  current: Option<DinoparcLink>,
  old: Vec<OldDinoparcLink>,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TouchLinkOptions<T: RemoteUserIdRef> {
  pub etwin: UserIdRef,
  #[cfg_attr(feature = "serde", serde(bound(deserialize = "T: RemoteUserIdRef")))]
  pub remote: T,
  pub linked_by: UserIdRef,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct EtwinLink {
  pub link: UserDot,
  pub unlink: (),
  pub etwin: ShortUser,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct OldEtwinLink {
  pub link: UserDot,
  pub unlink: UserDot,
  pub etwin: ShortUser,
}

#[cfg_attr(feature = "serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct VersionedEtwinLink {
  pub current: Option<EtwinLink>,
  pub old: Vec<OldEtwinLink>,
}

struct HammerfestLink {
  link: UserDot,
  user: ShortHammerfestUser,
}

struct OldHammerfestLink {
  link: UserDot,
  unlink: UserDot,
  user: ShortHammerfestUser,
}

struct VersionedHammerfestLink {
  current: Option<HammerfestLink>,
  old: Vec<OldHammerfestLink>,
}

struct CreateHammerfestLinkOptions {
  user_id: UserId,
  hammerfest_server: HammerfestServer,
  hammerfest_user_id: HammerfestUserId,
  linked_by: UserId,
}

struct TwinoidLink {
  link: UserDot,
  user: ShortTwinoidUser,
}

struct OldTwinoidLink {
  link: UserDot,
  unlink: UserDot,
  user: ShortTwinoidUser,
}

struct CreateTwinoidLinkOptions {
  user_id: UserId,
  twinoid_user_id: TwinoidUserId,
  linked_by: UserId,
}

struct VersionedTwinoidLink {
  current: Option<TwinoidLink>,
  old: Vec<OldTwinoidLink>,
}

pub struct GetLinkOptions<T: RemoteUserIdRef> {
  pub remote: T,
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
  Other(Box<dyn Error>),
}

#[async_trait]
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
  async fn get_link_from_hammerfest(
    &self,
    options: &GetLinkOptions<HammerfestUserIdRef>,
  ) -> Result<VersionedRawLink<HammerfestUserIdRef>, Box<dyn Error>>;
}
