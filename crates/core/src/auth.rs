use crate::user::ShortUser;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize), serde(untagged))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum AuthContext {
  Guest(GuestAuthContext),
  User(UserAuthContext),
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "Guest"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GuestAuthContext {
  pub scope: AuthScope,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "User"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserAuthContext {
  pub scope: AuthScope,
  pub user: ShortUser,
  pub is_administrator: bool,
}

declare_new_enum!(
  pub enum AuthScope {
    #[str("Default")]
    Default,
  }
  pub type ParseError = AuthScopeParseError;
);

#[cfg(test)]
mod test {
  use crate::auth::{AuthContext, AuthScope, GuestAuthContext, UserAuthContext};
  use crate::user::{ShortUser, UserDisplayNameVersion, UserDisplayNameVersions};
  #[cfg(feature = "_serde")]
  use std::fs;

  fn get_auth_context_guest() -> AuthContext {
    AuthContext::Guest(GuestAuthContext {
      scope: AuthScope::Default,
    })
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_auth_context_guest() {
    let s = fs::read_to_string("../../test-resources/core/auth/auth-context/guest/value.json").unwrap();
    let actual: AuthContext = serde_json::from_str(&s).unwrap();
    let expected = get_auth_context_guest();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_auth_context_guest() {
    let value = get_auth_context_guest();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/auth/auth-context/guest/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_guest_auth_context_guest() -> GuestAuthContext {
    GuestAuthContext {
      scope: AuthScope::Default,
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_guest_auth_context_guest() {
    let s = fs::read_to_string("../../test-resources/core/auth/guest-auth-context/guest/value.json").unwrap();
    let actual: GuestAuthContext = serde_json::from_str(&s).unwrap();
    let expected = get_guest_auth_context_guest();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_guest_auth_context_guest() {
    let value = get_guest_auth_context_guest();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/auth/guest-auth-context/guest/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }

  fn get_user_auth_context_demurgos() -> UserAuthContext {
    UserAuthContext {
      user: ShortUser {
        id: "9f310484-963b-446b-af69-797feec6813f".parse().unwrap(),
        display_name: UserDisplayNameVersions {
          current: UserDisplayNameVersion {
            value: "Demurgos".parse().unwrap(),
          },
        },
      },
      scope: AuthScope::Default,
      is_administrator: true,
    }
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn read_user_auth_context_demurgos() {
    let s = fs::read_to_string("../../test-resources/core/auth/user-auth-context/demurgos/value.json").unwrap();
    let actual: UserAuthContext = serde_json::from_str(&s).unwrap();
    let expected = get_user_auth_context_demurgos();
    assert_eq!(actual, expected);
  }

  #[cfg(feature = "_serde")]
  #[test]
  fn write_user_auth_context_demurgos() {
    let value = get_user_auth_context_demurgos();
    let actual: String = serde_json::to_string_pretty(&value).unwrap();
    let expected = fs::read_to_string("../../test-resources/core/auth/user-auth-context/demurgos/value.json").unwrap();
    assert_eq!(&actual, expected.trim());
  }
}
