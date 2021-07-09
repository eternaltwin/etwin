use std::collections::hash_map::Entry;
use std::collections::HashMap;
use std::fmt;
use std::fmt::Write;
use std::marker::PhantomData;
use std::ops::RangeInclusive;

#[derive(Debug, Clone)]
pub struct TypeRegistry {
  path_to_id: HashMap<MgTypePath, MgTypeId>,
  id_to_path: HashMap<MgTypeId, MgTypePath>,
  types: HashMap<MgTypeId, MgType>,
}

impl TypeRegistry {
  pub fn builder() -> TypeRegistryBuilder {
    TypeRegistryBuilder::new()
  }

  pub fn paths(&self) -> impl Iterator<Item = (&MgTypePath, &MgType)> {
    self
      .path_to_id
      .iter()
      .map(move |(p, id)| (p, self.types.get(id).unwrap()))
  }
}

pub struct TypeRegistryBuilder {
  next_id: u64,
  // TODO: Path -> AliasId, then AliasId -> enum { TypeId, GenericTypeId } and TypeId -> Type
  path_to_id: HashMap<MgTypePath, MgTypeId>,
  types: HashMap<MgTypeId, MgType>,
}

impl TypeRegistryBuilder {
  fn new() -> Self {
    Self {
      next_id: 0,
      path_to_id: HashMap::new(),
      types: HashMap::new(),
    }
  }

  pub fn declare(&mut self, typ_path: MgTypePath) -> MgTypeId {
    match self.path_to_id.entry(typ_path) {
      Entry::Vacant(e) => {
        let id = self.next_id;
        self.next_id += 1;
        *e.insert(MgTypeId(id))
      }
      Entry::Occupied(e) => *e.get(),
    }
  }

  pub fn define(&mut self, type_id: MgTypeId, typ: MgType) -> Result<(), anyhow::Error> {
    match self.types.entry(type_id) {
      Entry::Vacant(e) => {
        e.insert(typ);
        Ok(())
      }
      Entry::Occupied(e) if e.get() == &typ => Ok(()),
      Entry::Occupied(_) => Err(anyhow::Error::msg("ConflictingDefinitions")),
    }
  }

  pub fn add_unique(&mut self, typ_path: MgTypePath, typ: MgType) -> Result<MgTypeId, anyhow::Error> {
    let id = self.declare(typ_path);
    self.define(id, MgType::Unique(id, Box::new(typ))).map(|_| id)
  }

  pub fn build(self) -> Result<TypeRegistry, anyhow::Error> {
    let mut path_to_id: HashMap<MgTypePath, MgTypeId> = HashMap::new();
    let mut id_to_path: HashMap<MgTypeId, MgTypePath> = HashMap::new();
    for (path, typ_id) in self.path_to_id.into_iter() {
      if !self.types.contains_key(&typ_id) {
        return Err(anyhow::Error::msg(format!("MissingDefinitionFor: {:?}", path)));
      }
      id_to_path.insert(typ_id, path.clone());
      path_to_id.insert(path, typ_id);
    }
    Ok(TypeRegistry {
      path_to_id,
      id_to_path,
      types: self.types,
    })
  }
}

#[derive(Debug, Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Hash)]
pub struct MgTypeId(u64);

pub trait MgNameFormat: 'static {}
pub struct LowerSnake;
impl MgNameFormat for LowerSnake {}
pub struct PascalCase;
impl MgNameFormat for PascalCase {}

/// A name without any formatting associated: can be converted to snake case, pascal case, etc.
#[derive(Debug, Clone, Eq, PartialEq, Ord, PartialOrd, Hash)]
struct MgName {
  components: Vec<String>,
}

impl MgName {
  pub fn from_parts<S: AsRef<str>>(n: S) -> Result<Self, anyhow::Error> {
    let n = n.as_ref();
    if n.is_empty() {
      return Err(anyhow::Error::msg(format!("InvalidName: {}", n)));
    }
    let components: Result<Vec<_>, _> = n
      .split('_')
      .map(|c| -> Result<String, anyhow::Error> {
        if !c.is_empty() && c.chars().all(|c| c.is_ascii_lowercase()) {
          Ok(c.to_string())
        } else {
          Err(anyhow::Error::msg(format!("InvalidNameComponent: {}", c)))
        }
      })
      .collect();
    Ok(Self {
      components: components?,
    })
  }

  pub fn display<Format: MgNameFormat>(&self) -> DisplayMgName<Format> {
    DisplayMgName {
      name: self,
      marker: PhantomData,
    }
  }
}

#[derive(Debug, Copy, Clone)]
pub struct DisplayMgName<'n, Format: MgNameFormat> {
  name: &'n MgName,
  marker: PhantomData<&'static Format>,
}

impl<'n> fmt::Display for DisplayMgName<'n, LowerSnake> {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    for (i, component) in self.name.components.iter().enumerate() {
      if i > 0 {
        f.write_char('_')?;
      }
      f.write_str(component.as_str())?;
    }
    Ok(())
  }
}

impl<'n> fmt::Display for DisplayMgName<'n, PascalCase> {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    for component in self.name.components.iter() {
      for (i, c) in component.char_indices() {
        f.write_char(if i == 0 { c.to_ascii_uppercase() } else { c })?;
      }
    }
    Ok(())
  }
}

#[derive(Debug, Clone, Eq, PartialEq, Ord, PartialOrd, Hash)]
pub struct MgTypeName(MgName);
#[derive(Debug, Clone, Eq, PartialEq, Ord, PartialOrd, Hash)]
pub struct MgGroupName(MgName);
#[derive(Debug, Clone, Eq, PartialEq, Ord, PartialOrd, Hash)]
pub struct MgGroupPath(Vec<MgGroupName>);
#[derive(Debug, Clone, Eq, PartialEq, Ord, PartialOrd, Hash)]
pub struct MgTypePath(MgGroupPath, MgTypeName);

impl MgTypeName {
  pub fn from_parts<S: AsRef<str>>(n: S) -> Result<Self, anyhow::Error> {
    let name = MgName::from_parts(n)?;
    Ok(Self(name))
  }

  pub fn display<Format: MgNameFormat>(&self) -> DisplayMgName<Format> {
    self.0.display()
  }
}

impl MgGroupName {
  pub fn from_parts<S: AsRef<str>>(n: S) -> Result<Self, anyhow::Error> {
    let name = MgName::from_parts(n)?;
    Ok(Self(name))
  }

  pub fn with_type<S: AsRef<str>>(&self, n: S) -> Result<MgTypePath, anyhow::Error> {
    Ok(MgGroupPath::from_name(self.clone()).with_type(MgTypeName::from_parts(n)?))
  }

  pub fn display<Format: MgNameFormat>(&self) -> DisplayMgName<Format> {
    self.0.display()
  }
}

impl MgGroupPath {
  pub fn empty() -> Self {
    Self(Vec::new())
  }

  pub fn from_name(n: MgGroupName) -> Self {
    Self(vec![n])
  }

  pub fn with_type(&self, type_name: MgTypeName) -> MgTypePath {
    MgTypePath(self.clone(), type_name)
  }
}

impl MgTypePath {
  pub fn group_names(&self) -> &[MgGroupName] {
    &self.group_path().0
  }

  pub fn group_path(&self) -> &MgGroupPath {
    &self.0
  }

  pub fn type_name(&self) -> &MgTypeName {
    &self.1
  }
}

#[derive(Debug, Clone, Eq, PartialEq, Ord, PartialOrd, Hash)]
pub enum MgType {
  String,
  Uint(MgUintType),
  Sint(MgSintType),
  Unique(MgTypeId, Box<MgType>),
}

impl MgType {
  pub const U8: Self = Self::Uint(MgUintType::U8);
  pub const U16: Self = Self::Uint(MgUintType::U16);
  pub const U32: Self = Self::Uint(MgUintType::U32);
  pub const U64: Self = Self::Uint(MgUintType::U64);
  pub const I8: Self = Self::Sint(MgSintType::I8);
  pub const I16: Self = Self::Sint(MgSintType::I16);
  pub const I32: Self = Self::Sint(MgSintType::I32);
  pub const I64: Self = Self::Sint(MgSintType::I64);
}

#[derive(Debug, Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Hash)]
pub struct MgUintType {
  min: u64,
  max: u64,
}

impl MgUintType {
  pub const U8: Self = Self {
    min: 0,
    max: u8::MAX as u64,
  };
  pub const U16: Self = Self {
    min: 0,
    max: u16::MAX as u64,
  };
  pub const U32: Self = Self {
    min: 0,
    max: u32::MAX as u64,
  };
  pub const U64: Self = Self { min: 0, max: u64::MAX };

  pub fn can_convert_from(self, other: Self) -> bool {
    self.min() <= other.min() && other.max() <= self.max()
  }

  pub fn can_convert_to(self, other: Self) -> bool {
    other.min() <= self.min() && self.max() <= other.max()
  }

  pub fn min(self) -> u64 {
    self.min
  }

  pub fn max(self) -> u64 {
    self.max
  }
}

#[derive(Debug, Copy, Clone, Eq, PartialEq, Ord, PartialOrd, Hash)]
pub struct MgSintType {
  min: i64,
  max: i64,
}

impl MgSintType {
  pub const I8: Self = Self {
    min: i8::MIN as i64,
    max: i8::MAX as i64,
  };
  pub const I16: Self = Self {
    min: i16::MIN as i64,
    max: i16::MAX as i64,
  };
  pub const I32: Self = Self {
    min: i32::MIN as i64,
    max: i32::MAX as i64,
  };
  pub const I64: Self = Self {
    min: i64::MIN,
    max: i64::MAX,
  };

  pub fn can_convert_from(self, other: Self) -> bool {
    self.min() <= other.min() && other.max() <= self.max()
  }

  pub fn can_convert_to(self, other: Self) -> bool {
    other.min() <= self.min() && self.max() <= other.max()
  }

  pub fn min(self) -> i64 {
    self.min
  }

  pub fn max(self) -> i64 {
    self.max
  }
}

pub trait MetagenBackend {
  fn emit(&self, registry: &TypeRegistry) -> Result<(), anyhow::Error>;
}
