#[cfg(feature = "chrono")]
use chrono::{DateTime, Utc};
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
  Option::deserialize(deserializer)
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

#[cfg(feature = "chrono")]
const INSTANT_FORMAT: &str = "%FT%T%.3fZ";

#[cfg(feature = "chrono")]
pub fn serialize_instant<S: Serializer>(value: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error> {
  value.format(INSTANT_FORMAT).to_string().serialize(serializer)
}

#[cfg(feature = "chrono")]
pub fn serialize_opt_instant<S: Serializer>(value: &Option<DateTime<Utc>>, serializer: S) -> Result<S::Ok, S::Error> {
  value
    .map(|v| v.format(INSTANT_FORMAT).to_string())
    .serialize(serializer)
}

#[cfg(feature = "serde-http")]
mod http {
  use http::header::HeaderName;
  use http::{HeaderMap, HeaderValue, StatusCode};
  use reqwest::Response;
  use serde::ser::SerializeSeq;
  use serde::{Serialize, Serializer};

  #[derive(Serialize)]
  struct SerializableResponse<'a> {
    #[serde(serialize_with = "serialize_status_code")]
    status: StatusCode,
    #[serde(serialize_with = "serialize_header_map")]
    headers: &'a HeaderMap,
    url: &'a str,
  }

  impl<'a> From<&'a Response> for SerializableResponse<'a> {
    fn from(res: &'a Response) -> Self {
      Self {
        status: res.status(),
        headers: res.headers(),
        url: res.url().as_str(),
      }
    }
  }

  pub fn serialize_status_code<S: Serializer>(value: &StatusCode, serializer: S) -> Result<S::Ok, S::Error> {
    value.as_u16().serialize(serializer)
  }

  pub fn serialize_response<S: Serializer>(value: &reqwest::Response, serializer: S) -> Result<S::Ok, S::Error> {
    SerializableResponse::from(value).serialize(serializer)
  }

  pub fn serialize_opt_response_ref<S: Serializer>(
    value: &Option<&reqwest::Response>,
    serializer: S,
  ) -> Result<S::Ok, S::Error> {
    value.map(SerializableResponse::from).serialize(serializer)
  }

  #[derive(Copy, Clone)]
  struct HeaderMapPair<'a>(&'a HeaderName, &'a HeaderValue);
  impl<'a> Serialize for HeaderMapPair<'a> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
      S: Serializer,
    {
      let is_human_readable = serializer.is_human_readable();
      let HeaderMapPair(k, v) = *self;
      let mut pair = serializer.serialize_seq(Some(2))?;
      pair.serialize_element(k.as_str())?;
      if is_human_readable {
        match v.to_str() {
          Ok(v) => pair.serialize_element(v)?,
          Err(_) => pair.serialize_element(v.as_bytes())?,
        }
      } else {
        pair.serialize_element(v.as_bytes())?;
      }
      pair.end()
    }
  }

  pub fn serialize_header_map<S: Serializer>(value: &HeaderMap, serializer: S) -> Result<S::Ok, S::Error> {
    let count = value.iter().count();
    let mut map = serializer.serialize_seq(Some(count))?;
    for (k, v) in value.iter() {
      map.serialize_element(&HeaderMapPair(k, v))?;
    }
    map.end()
  }
}

#[cfg(feature = "serde-http")]
pub use self::http::{serialize_header_map, serialize_opt_response_ref, serialize_response, serialize_status_code};

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
