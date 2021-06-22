use crate::core::{Instant, IntPercentage};
use crate::link::VersionedEtwinLink;
use crate::temporal::LatestTemporal;
use crate::types::EtwinError;
use async_trait::async_trait;
use auto_impl::auto_impl;
use enum_iterator::IntoEnumIterator;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{serialize_ordered_map, Deserialize, Serialize, Serializer};
#[cfg(feature = "sqlx")]
use sqlx::{database, postgres, Database, Postgres};
use std::collections::HashMap;
use std::error::Error;
use std::fmt;
use std::iter::FusedIterator;
use std::str::FromStr;

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetDinoparcUserOptions {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
  pub time: Option<Instant>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GetDinoparcDinozOptions {
  pub server: DinoparcServer,
  pub id: DinoparcDinozId,
  pub time: Option<Instant>,
}

// TODO: Use `new_enum` macro
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, IntoEnumIterator)]
pub enum DinoparcServer {
  #[cfg_attr(feature = "_serde", serde(rename = "dinoparc.com"))]
  DinoparcCom,
  #[cfg_attr(feature = "_serde", serde(rename = "en.dinoparc.com"))]
  EnDinoparcCom,
  #[cfg_attr(feature = "_serde", serde(rename = "sp.dinoparc.com"))]
  SpDinoparcCom,
}

impl DinoparcServer {
  pub const fn as_str(&self) -> &'static str {
    match self {
      Self::DinoparcCom => "dinoparc.com",
      Self::EnDinoparcCom => "en.dinoparc.com",
      Self::SpDinoparcCom => "sp.dinoparc.com",
    }
  }

  pub fn iter() -> impl Iterator<Item = Self> + ExactSizeIterator + FusedIterator + Copy {
    Self::into_enum_iter()
  }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcServerParseError;

impl fmt::Display for DinoparcServerParseError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "DinoparcServerParseError")
  }
}

impl Error for DinoparcServerParseError {}

impl FromStr for DinoparcServer {
  type Err = DinoparcServerParseError;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    match s {
      "dinoparc.com" => Ok(Self::DinoparcCom),
      "en.dinoparc.com" => Ok(Self::EnDinoparcCom),
      "sp.dinoparc.com" => Ok(Self::SpDinoparcCom),
      _ => Err(DinoparcServerParseError),
    }
  }
}

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for DinoparcServer {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("dinoparc_server")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info() || <&str as sqlx::Type<Postgres>>::compatible(ty)
  }
}

#[cfg(feature = "sqlx")]
impl<'r, Db: Database> sqlx::Decode<'r, Db> for DinoparcServer
where
  &'r str: sqlx::Decode<'r, Db>,
{
  fn decode(
    value: <Db as database::HasValueRef<'r>>::ValueRef,
  ) -> Result<DinoparcServer, Box<dyn Error + 'static + Send + Sync>> {
    let value: &str = <&str as sqlx::Decode<Db>>::decode(value)?;
    Ok(value.parse()?)
  }
}

#[cfg(feature = "sqlx")]
impl<'q, Db: Database> sqlx::Encode<'q, Db> for DinoparcServer
where
  &'q str: sqlx::Encode<'q, Db>,
{
  fn encode_by_ref(&self, buf: &mut <Db as database::HasArguments<'q>>::ArgumentBuffer) -> sqlx::encode::IsNull {
    self.as_str().encode(buf)
  }
}

declare_decimal_id! {
  pub struct DinoparcUserId(u32);
  pub type ParseError = DinoparcUserIdParseError;
  const BOUNDS = 1..1_000_000_000;
  const SQL_NAME = "dinoparc_user_id";
}

declare_new_string! {
  pub struct DinoparcUsername(String);
  pub type ParseError = DinoparcUsernameParseError;
  const PATTERN = r"^[0-9A-Za-z-]{1,14}$";
  const SQL_NAME = "dinoparc_username";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcPassword(String);

impl DinoparcPassword {
  pub fn new(raw: String) -> Self {
    Self(raw)
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcCredentials {
  pub server: DinoparcServer,
  pub username: DinoparcUsername,
  pub password: DinoparcPassword,
}

declare_new_string! {
  /// A Dinoparc session key.
  ///
  /// It correspond to the value of the `sid` cookie.
  ///
  /// - `oetxjSBD3FEqDlLLNffGUY0NLKMmDDjv`
  /// - `pJ5zOeaKuw0mjGB9xdGVJuRdpCASjmBl`
  /// - `LlkSCMQW5fESPSOUVt3FMrqBwXwAhwzj`
  pub struct DinoparcSessionKey(String);
  pub type ParseError = DinoparcSessionKeyParseError;
  const PATTERN = r"^[0-9a-zA-Z]{32}$";
  const SQL_NAME = "dinoparc_session_key";
}

declare_new_string! {
  pub struct DinoparcMachineId(String);
  pub type ParseError = DinoparcMachineIdParseError;
  const PATTERN = r"^[0-9a-zA-Z]{32}$";
  const SQL_NAME = "dinoparc_machine_id";
}

impl DinoparcMachineId {
  pub const LENGTH: usize = 32;
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcSession {
  pub ctime: Instant,
  pub atime: Instant,
  pub key: DinoparcSessionKey,
  pub user: ShortDinoparcUser,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct StoredDinoparcSession {
  pub key: DinoparcSessionKey,
  pub user: DinoparcUserIdRef,
  pub ctime: Instant,
  pub atime: Instant,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinoparcUser"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortDinoparcUser {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
  pub username: DinoparcUsername,
}

impl ShortDinoparcUser {
  pub const fn as_ref(&self) -> DinoparcUserIdRef {
    DinoparcUserIdRef {
      server: self.server,
      id: self.id,
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinoparcUser"))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ArchivedDinoparcUser {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
  pub archived_at: Instant,
  pub username: DinoparcUsername,
  pub coins: Option<LatestTemporal<u32>>,
  pub dinoz: Option<LatestTemporal<Vec<DinoparcDinozIdRef>>>,
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_ordered_opt_temporal_map"))]
  pub inventory: Option<LatestTemporal<HashMap<DinoparcItemId, u32>>>,
}

/// `ArchivedDinoparcUser` extend with `etwin` to provide Eternaltwin-specific data.
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinoparcUser"))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct EtwinDinoparcUser {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
  pub archived_at: Instant,
  pub username: DinoparcUsername,
  pub coins: Option<LatestTemporal<u32>>,
  pub dinoz: Option<LatestTemporal<Vec<DinoparcDinozIdRef>>>,
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_ordered_opt_temporal_map"))]
  pub inventory: Option<LatestTemporal<HashMap<DinoparcItemId, u32>>>,
  pub etwin: VersionedEtwinLink,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinoparcUser"))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcUserIdRef {
  pub server: DinoparcServer,
  pub id: DinoparcUserId,
}

declare_decimal_id! {
  pub struct DinoparcDinozId(u32);
  pub type ParseError = DinoparcDinozIdParseError;
  const BOUNDS = 1..1_000_000_000;
  const SQL_NAME = "dinoparc_dinoz_id";
}

declare_decimal_id! {
  pub struct DinoparcItemId(u32);
  pub type ParseError = DinoparcItemIdParseError;
  const BOUNDS = 1..1_000_000_000;
  const SQL_NAME = "dinoparc_item_id";
}

declare_new_string! {
  pub struct DinoparcDinozName(String);
  pub type ParseError = DinoparcDinozNameParseError;
  const PATTERN = r"^.{1,50}$";
  const SQL_NAME = "dinoparc_dinoz_name";
}

declare_new_string! {
  pub struct DinoparcDinozSkin(String);
  pub type ParseError = DinoparcDinozSkinParseError;
  const PATTERN = r"^.{1,30}$";
  const SQL_NAME = "dinoparc_dinoz_skin";
}

declare_decimal_id! {
  pub struct DinoparcLocationId(u8);
  pub type ParseError = DinoparcLocationIdParseError;
  const BOUNDS = 0..23;
  const SQL_NAME = "dinoparc_location_id";
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinoparcDinoz"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcDinozIdRef {
  pub server: DinoparcServer,
  pub id: DinoparcDinozId,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinoparcDinoz"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ShortDinoparcDinoz {
  pub server: DinoparcServer,
  pub id: DinoparcDinozId,
  pub name: DinoparcDinozName,
  pub location: DinoparcLocationId,
}

impl ShortDinoparcDinoz {
  pub const fn as_ref(&self) -> DinoparcDinozIdRef {
    DinoparcDinozIdRef {
      server: self.server,
      id: self.id,
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinoparcDinoz"))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DinoparcDinoz {
  pub server: DinoparcServer,
  pub id: DinoparcDinozId,
  pub name: DinoparcDinozName,
  pub location: DinoparcLocationId,
  pub race: DinoparcDinozRace,
  /// Raw skin code
  pub skin: DinoparcDinozSkin,
  pub life: IntPercentage,
  pub level: u16,
  pub experience: IntPercentage,
  pub danger: i16,
  pub in_tournament: bool,
  pub elements: DinoparcDinozElements,
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_ordered_map"))]
  pub skills: HashMap<DinoparcSkill, DinoparcSkillLevel>,
}

impl DinoparcDinoz {
  pub const fn as_ref(&self) -> DinoparcDinozIdRef {
    DinoparcDinozIdRef {
      server: self.server,
      id: self.id,
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "DinoparcUser"))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ArchivedDinoparcDinoz {
  pub server: DinoparcServer,
  pub id: DinoparcDinozId,
  pub archived_at: Instant,
  pub name: Option<LatestTemporal<DinoparcDinozName>>,
  pub location: Option<LatestTemporal<DinoparcLocationId>>,
  pub race: Option<LatestTemporal<DinoparcDinozRace>>,
  pub skin: Option<LatestTemporal<DinoparcDinozSkin>>,
  pub life: Option<LatestTemporal<IntPercentage>>,
  pub level: Option<LatestTemporal<u16>>,
  pub experience: Option<LatestTemporal<IntPercentage>>,
  pub danger: Option<LatestTemporal<i16>>,
  pub in_tournament: Option<LatestTemporal<bool>>,
  pub elements: Option<LatestTemporal<DinoparcDinozElements>>,
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_ordered_opt_temporal_map"))]
  pub skills: Option<LatestTemporal<HashMap<DinoparcSkill, DinoparcSkillLevel>>>,
}

pub type EtwinDinoparcDinoz = ArchivedDinoparcDinoz;

declare_new_int! {
  pub struct DinoparcSkillLevel(u8);
  pub type RangeError = DinoparcSkillLevelRangeError;
  const BOUNDS = 0..=5;
  type SqlType = i16;
  const SQL_NAME = "dinoparc_skill_level";
}

declare_new_enum!(
  #[derive(IntoEnumIterator)]
  pub enum DinoparcDinozRace {
    #[str("Cargou")]
    Cargou,
    #[str("Castivore")]
    Castivore,
    #[str("Gluon")]
    Gluon,
    #[str("Gorriloz")]
    Gorriloz,
    #[str("Hippoclamp")]
    Hippoclamp,
    #[str("Kabuki")]
    Kabuki,
    #[str("Korgon")]
    Korgon,
    #[str("Kump")]
    Kump,
    #[str("Moueffe")]
    Moueffe,
    #[str("Ouistiti")]
    Ouistiti,
    #[str("Picori")]
    Picori,
    #[str("Pigmou")]
    Pigmou,
    #[str("Pteroz")]
    Pteroz,
    #[str("Rokky")]
    Rokky,
    #[str("Santaz")]
    Santaz,
    #[str("Serpantin")]
    Serpantin,
    #[str("Sirain")]
    Sirain,
    #[str("Wanwan")]
    Wanwan,
    #[str("Winks")]
    Winks,
  }
  pub type ParseError = DinoparcDinozRaceParseError;
  const SQL_NAME = "dinoparc_dinoz_race";
);

impl DinoparcDinozRace {
  pub fn from_skin_code(skin: &str) -> Self {
    if let Some(c) = skin.chars().next() {
      match c {
        '0' => Self::Moueffe,
        '1' => Self::Picori,
        '2' => Self::Castivore,
        '3' => Self::Sirain,
        '4' => Self::Winks,
        '5' => Self::Gorriloz,
        '6' => Self::Cargou,
        '7' => Self::Hippoclamp,
        '8' => Self::Rokky,
        '9' => Self::Pigmou,
        'A' => Self::Wanwan,
        'B' => Self::Gluon,
        'C' => Self::Kump,
        'D' => Self::Pteroz,
        'E' => Self::Santaz,
        'F' => Self::Ouistiti,
        'G' => Self::Korgon,
        'H' => Self::Kabuki,
        'I' => Self::Serpantin,
        _ => Self::Moueffe,
      }
    } else {
      Self::Moueffe
    }
  }
}

/// Data in the left bar for logged-in users
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcDinozElements {
  pub fire: u16,
  pub earth: u16,
  pub water: u16,
  pub thunder: u16,
  pub air: u16,
}

#[cfg(feature = "sqlx")]
impl sqlx::Type<Postgres> for DinoparcDinozElements {
  fn type_info() -> postgres::PgTypeInfo {
    postgres::PgTypeInfo::with_name("dinoparc_dinoz_elements")
  }

  fn compatible(ty: &postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info() || *ty == postgres::PgTypeInfo::with_name("raw_dinoparc_dinoz_elements")
  }
}

#[cfg(feature = "sqlx")]
impl<'r> sqlx::Decode<'r, Postgres> for DinoparcDinozElements {
  fn decode(value: postgres::PgValueRef<'r>) -> Result<Self, Box<dyn std::error::Error + 'static + Send + Sync>> {
    let mut decoder = postgres::types::PgRecordDecoder::new(value)?;

    let fire = decoder.try_decode::<crate::pg_num::PgU16>()?;
    let earth = decoder.try_decode::<crate::pg_num::PgU16>()?;
    let water = decoder.try_decode::<crate::pg_num::PgU16>()?;
    let thunder = decoder.try_decode::<crate::pg_num::PgU16>()?;
    let air = decoder.try_decode::<crate::pg_num::PgU16>()?;

    Ok(Self {
      fire: fire.into(),
      earth: earth.into(),
      water: water.into(),
      thunder: thunder.into(),
      air: air.into(),
    })
  }
}

#[cfg(feature = "sqlx")]
impl<'q> sqlx::Encode<'q, Postgres> for DinoparcDinozElements {
  fn encode_by_ref(&self, buf: &mut postgres::PgArgumentBuffer) -> sqlx::encode::IsNull {
    let mut encoder = postgres::types::PgRecordEncoder::new(buf);
    encoder.encode(crate::pg_num::PgU16::from(self.fire));
    encoder.encode(crate::pg_num::PgU16::from(self.earth));
    encoder.encode(crate::pg_num::PgU16::from(self.water));
    encoder.encode(crate::pg_num::PgU16::from(self.thunder));
    encoder.encode(crate::pg_num::PgU16::from(self.air));
    encoder.finish();
    sqlx::encode::IsNull::No
  }
}

declare_new_enum!(
  #[derive(IntoEnumIterator)]
  pub enum DinoparcSkill {
    #[str("Bargain")]
    Bargain,
    #[str("Camouflage")]
    Camouflage,
    #[str("Climb")]
    Climb,
    #[str("Cook")]
    Cook,
    #[str("Counterattack")]
    Counterattack,
    #[str("Dexterity")]
    Dexterity,
    #[str("Dig")]
    Dig,
    #[str("EarthApprentice")]
    EarthApprentice,
    #[str("FireApprentice")]
    FireApprentice,
    #[str("FireProtection")]
    FireProtection,
    #[str("Intelligence")]
    Intelligence,
    #[str("Juggle")]
    Juggle,
    #[str("Jump")]
    Jump,
    #[str("Luck")]
    Luck,
    #[str("MartialArts")]
    MartialArts,
    #[str("Medicine")]
    Medicine,
    #[str("Mercenary")]
    Mercenary,
    #[str("Music")]
    Music,
    #[str("Navigation")]
    Navigation,
    #[str("Perception")]
    Perception,
    #[str("Provoke")]
    Provoke,
    #[str("Run")]
    Run,
    #[str("Saboteur")]
    Saboteur,
    #[str("ShadowPower")]
    ShadowPower,
    #[str("Spy")]
    Spy,
    #[str("Stamina")]
    Stamina,
    #[str("Steal")]
    Steal,
    #[str("Strategy")]
    Strategy,
    #[str("Strength")]
    Strength,
    #[str("Survival")]
    Survival,
    #[str("Swim")]
    Swim,
    #[str("ThunderApprentice")]
    ThunderApprentice,
    #[str("TotemThief")]
    TotemThief,
    #[str("WaterApprentice")]
    WaterApprentice,
  }
  pub type ParseError = DinoparcSkillParseError;
  const SQL_NAME = "dinoparc_skill";
);

/// Data in the left bar for logged-in users
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DinoparcSessionUser<U = ShortDinoparcUser> {
  pub user: U,
  pub coins: u32,
  pub dinoz: Vec<ShortDinoparcDinoz>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DinoparcInventoryResponse<U = ShortDinoparcUser> {
  pub session_user: DinoparcSessionUser<U>,
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_ordered_map"))]
  pub inventory: HashMap<DinoparcItemId, u32>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DinoparcDinozResponse<U = ShortDinoparcUser> {
  pub session_user: DinoparcSessionUser<U>,
  pub dinoz: DinoparcDinoz,
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait DinoparcClient: Send + Sync {
  async fn create_session(&self, options: &DinoparcCredentials) -> Result<DinoparcSession, EtwinError>;

  async fn test_session(
    &self,
    server: DinoparcServer,
    key: &DinoparcSessionKey,
  ) -> Result<Option<DinoparcSession>, EtwinError>;

  async fn get_dinoz(
    &self,
    session: &DinoparcSession,
    id: DinoparcDinozId,
  ) -> Result<DinoparcDinozResponse, EtwinError>;

  async fn get_inventory(&self, session: &DinoparcSession) -> Result<DinoparcInventoryResponse, EtwinError>;
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait DinoparcStore: Send + Sync {
  async fn touch_short_user(&self, options: &ShortDinoparcUser) -> Result<ArchivedDinoparcUser, EtwinError>;

  async fn touch_inventory(&self, response: &DinoparcInventoryResponse) -> Result<(), EtwinError>;

  async fn touch_dinoz(&self, response: &DinoparcDinozResponse) -> Result<(), EtwinError>;

  async fn get_dinoz(&self, options: &GetDinoparcDinozOptions) -> Result<Option<ArchivedDinoparcDinoz>, EtwinError>;

  async fn get_user(&self, options: &GetDinoparcUserOptions) -> Result<Option<ArchivedDinoparcUser>, EtwinError>;
}

#[cfg(feature = "_serde")]
pub fn serialize_ordered_opt_temporal_map<K: Ord + Serialize, V: Serialize, S: Serializer>(
  value: &Option<LatestTemporal<HashMap<K, V>>>,
  serializer: S,
) -> Result<S::Ok, S::Error> {
  value
    .as_ref()
    .map(|t| {
      t.as_ref()
        .map(|m| m.iter().collect::<std::collections::BTreeMap<_, _>>())
    })
    .serialize(serializer)
}

#[cfg(test)]
mod test {
  use crate::core::{IntPercentage, PeriodLower};
  use crate::dinoparc::{
    ArchivedDinoparcDinoz, ArchivedDinoparcUser, DinoparcDinozElements, DinoparcDinozIdRef, DinoparcDinozRace,
    DinoparcServer, DinoparcSkill, DinoparcSkillLevel,
  };
  use crate::temporal::{LatestTemporal, Snapshot};
  use chrono::{TimeZone, Utc};
  use std::collections::HashMap;
  use std::fs;

  #[allow(clippy::unnecessary_wraps)]
  fn get_archived_dinoparc_user_alice_rokky() -> ArchivedDinoparcUser {
    ArchivedDinoparcUser {
      server: DinoparcServer::DinoparcCom,
      id: "1".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      username: "alice".parse().unwrap(),
      coins: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: 10000,
        },
      }),
      inventory: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: {
            let mut inventory = HashMap::new();
            inventory.insert("4".parse().unwrap(), 10);
            inventory
          },
        },
      }),
      dinoz: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: vec![DinoparcDinozIdRef {
            server: DinoparcServer::DinoparcCom,
            id: "2".parse().unwrap(),
          }],
        },
      }),
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_archived_dinoparc_user_alice_rokky() {
    let s =
      fs::read_to_string("../../test-resources/core/dinoparc/archived-dinoparc-user/alice-rokky/value.json").unwrap();
    let actual: ArchivedDinoparcUser = serde_json::from_str(&s).unwrap();
    let expected = get_archived_dinoparc_user_alice_rokky();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[ignore]
  #[test]
  fn write_archived_dinoparc_user_alice_rokky() {
    let value = get_archived_dinoparc_user_alice_rokky();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected =
      fs::read_to_string("../../test-resources/core/dinoparc/archived-dinoparc-user/alice-rokky/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  #[allow(clippy::unnecessary_wraps)]
  fn get_archived_dinoparc_dinoz_yasumi() -> ArchivedDinoparcDinoz {
    ArchivedDinoparcDinoz {
      server: DinoparcServer::EnDinoparcCom,
      id: "765483".parse().unwrap(),
      archived_at: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      name: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: "Yasumi".parse().unwrap(),
        },
      }),
      location: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: "0".parse().unwrap(),
        },
      }),
      race: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: DinoparcDinozRace::Wanwan,
        },
      }),
      skin: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: "Ac9OrgxOWu1pd7Fp".parse().unwrap(),
        },
      }),
      life: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: IntPercentage::new(30).unwrap(),
        },
      }),
      level: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: 12,
        },
      }),
      experience: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: IntPercentage::new(13).unwrap(),
        },
      }),
      danger: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: 116,
        },
      }),
      in_tournament: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: false,
        },
      }),
      elements: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: DinoparcDinozElements {
            fire: 10,
            earth: 0,
            water: 0,
            thunder: 7,
            air: 2,
          },
        },
      }),
      skills: Some(LatestTemporal {
        latest: Snapshot {
          period: PeriodLower::unbounded(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0)),
          value: {
            let mut skills = HashMap::new();
            skills.insert(DinoparcSkill::Dexterity, DinoparcSkillLevel::new(2).unwrap());
            skills.insert(DinoparcSkill::Intelligence, DinoparcSkillLevel::new(5).unwrap());
            skills.insert(DinoparcSkill::Strength, DinoparcSkillLevel::new(5).unwrap());
            skills.insert(DinoparcSkill::MartialArts, DinoparcSkillLevel::new(5).unwrap());
            skills
          },
        },
      }),
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_archived_dinoparc_dinoz_yasumi() {
    let s = fs::read_to_string("../../test-resources/core/dinoparc/archived-dinoparc-dinoz/yasumi/value.json").unwrap();
    let actual: ArchivedDinoparcDinoz = serde_json::from_str(&s).unwrap();
    let expected = get_archived_dinoparc_dinoz_yasumi();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_archived_dinoparc_dinoz_yasumi() {
    let value = get_archived_dinoparc_dinoz_yasumi();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected =
      fs::read_to_string("../../test-resources/core/dinoparc/archived-dinoparc-dinoz/yasumi/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }
}
