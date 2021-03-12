use hex::FromHex;
pub use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};

/// Serializes `buffer` to a lowercase hex string.
pub fn buffer_to_hex<T, S>(buffer: &T, serializer: S) -> Result<S::Ok, S::Error>
where
  T: AsRef<[u8]>,
  S: Serializer,
{
  serializer.serialize_str(hex::encode(buffer).as_ref())
}

/// Deserializes a lowercase hex string to a `Vec<u8>`.
pub fn hex_to_buffer<'de, D>(deserializer: D) -> Result<Vec<u8>, D::Error>
where
  D: Deserializer<'de>,
{
  use serde::de::Error;
  String::deserialize(deserializer)
    .and_then(|string| Vec::from_hex(&string).map_err(|err| Error::custom(err.to_string())))
}

/// Deserializes an optional field that can't be missing.
///
/// The field must always be defined, either with a value or explicitly unset (e.g. with `null`).
///
/// Use this to prevent `undefined` from being deserialized as `None` when parsing JSON.
///
/// ```rust
/// use serde::{Deserialize, Serialize};
/// use etwin_serde_tools::deserialize_explicit_option;
///
/// #[derive(Serialize, Deserialize)]
/// #[derive(Debug, PartialEq, Eq)]
/// struct User {
///   id: u32,
///   #[serde(deserialize_with = "deserialize_explicit_option")]
///   username: Option<String>,
/// }
///
/// assert!(serde_json::from_str::<User>(r#"{"id":1}"#).is_err());
/// assert_eq!(
///   serde_json::from_str::<User>(r#"{"id":1,"username":null}"#).unwrap(),
///   User { id: 1, username: None }
/// );
/// assert_eq!(
///   serde_json::from_str::<User>(r#"{"id":1,"username":"demurgos"}"#).unwrap(),
///   User { id: 1, username: Some("demurgos".to_string()) }
/// );
/// ```
pub fn deserialize_explicit_option<'de, T, D>(deserializer: D) -> Result<Option<T>, D::Error>
where
  T: Deserialize<'de>,
  D: serde::Deserializer<'de>,
{
  Ok(Option::deserialize(deserializer)?)
}

/// Deserializes a nested optional field
///
/// The outer Option corresponds to the field existence (missing or present).
/// The inner Option corresponds to the field value (unset or value).
///
/// You must combine it with the `default` Serde attribute.
///
/// ```rust
/// use serde::{Deserialize, Serialize};
/// use etwin_serde_tools::deserialize_nested_option;
///
/// #[derive(Serialize, Deserialize)]
/// #[derive(Debug, PartialEq, Eq)]
/// struct User {
///   id: u32,
///   #[serde(default, deserialize_with = "deserialize_nested_option")]
///   username: Option<Option<String>>,
/// }
///
/// assert_eq!(
///   serde_json::from_str::<User>(r#"{"id":1}"#).unwrap(),
///   User { id: 1, username: None }
/// );
/// assert_eq!(
///   serde_json::from_str::<User>(r#"{"id":1,"username":null}"#).unwrap(),
///   User { id: 1, username: Some(None) }
/// );
/// assert_eq!(
///   serde_json::from_str::<User>(r#"{"id":1,"username":"demurgos"}"#).unwrap(),
///   User { id: 1, username: Some(Some("demurgos".to_string())) }
/// );
/// ```
pub fn deserialize_nested_option<'de, T, D>(deserializer: D) -> Result<Option<Option<T>>, D::Error>
where
  T: Deserialize<'de>,
  D: serde::Deserializer<'de>,
{
  Ok(Some(Option::deserialize(deserializer)?))
}

pub fn serialize_ordered_map<K: Ord + Serialize, V: Serialize, S: Serializer>(
  value: &HashMap<K, V>,
  serializer: S,
) -> Result<S::Ok, S::Error> {
  let ordered: BTreeMap<_, _> = value.iter().collect();
  ordered.serialize(serializer)
}

pub fn serialize_ordered_set<T: Ord + Serialize, S: Serializer>(
  value: &HashSet<T>,
  serializer: S,
) -> Result<S::Ok, S::Error> {
  let ordered: BTreeSet<_> = value.iter().collect();
  ordered.serialize(serializer)
}

#[cfg(test)]
mod test {
  use super::{deserialize_explicit_option, deserialize_nested_option};
  use serde::{Deserialize, Serialize};

  #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
  struct ExplicitUser {
    id: u32,
    #[serde(deserialize_with = "deserialize_explicit_option")]
    username: Option<String>,
  }

  #[test]
  fn read_error_on_missing_explicit_option() {
    let s = r#"{"id":1}"#;
    let actual = serde_json::from_str::<ExplicitUser>(s);
    match actual {
      Ok(_) => panic!("Expected parse error on missing `username` field"),
      Err(actual) => {
        assert_eq!(actual.classify(), serde_json::error::Category::Data);
        assert_eq!(actual.to_string(), "missing field `username` at line 1 column 8");
      }
    }
  }

  #[test]
  fn read_ok_on_null_explicit_option() {
    let s = r#"{"id":1,"username":null}"#;
    let actual = serde_json::from_str::<ExplicitUser>(s).unwrap();
    let expected = ExplicitUser { id: 1, username: None };
    assert_eq!(actual, expected);
  }

  #[test]
  fn read_ok_on_defined_explicit_option() {
    let s = r#"{"id":1,"username":"demurgos"}"#;
    let actual = serde_json::from_str::<ExplicitUser>(s).unwrap();
    let expected = ExplicitUser {
      id: 1,
      username: Some("demurgos".to_string()),
    };
    assert_eq!(actual, expected);
  }

  #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
  struct NestedUser {
    id: u32,
    #[serde(default, deserialize_with = "deserialize_nested_option")]
    username: Option<Option<String>>,
  }

  #[test]
  fn read_error_on_missing_nested_option() {
    let s = r#"{"id":1}"#;
    let actual = serde_json::from_str::<NestedUser>(s).unwrap();
    let expected = NestedUser { id: 1, username: None };
    assert_eq!(actual, expected);
  }

  #[test]
  fn read_ok_on_null_nested_option() {
    let s = r#"{"id":1,"username":null}"#;
    let actual = serde_json::from_str::<NestedUser>(s).unwrap();
    let expected = NestedUser {
      id: 1,
      username: Some(None),
    };
    assert_eq!(actual, expected);
  }

  #[test]
  fn read_ok_on_defined_nested_option() {
    let s = r#"{"id":1,"username":"demurgos"}"#;
    let actual = serde_json::from_str::<NestedUser>(s).unwrap();
    let expected = NestedUser {
      id: 1,
      username: Some(Some("demurgos".to_string())),
    };
    assert_eq!(actual, expected);
  }
}
