use crate::core::{Instant, LocaleId};
use crate::email::EmailAddress;
use crate::oauth::{OauthClientId, OauthClientKey, ShortOauthClient};
use crate::password::Password;
use crate::types::EtwinError;
use crate::user::{ShortUser, UserDisplayName, UserDisplayNameVersions, UserId, UserIdRef, Username};
use async_trait::async_trait;
use auto_impl::auto_impl;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{serialize_instant, Deserialize, Serialize};
use std::str::FromStr;
use uuid::Uuid;

// TODO: Deserialization is _very_ weak here and relies on the order of the fields...
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize), serde(untagged))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum AuthContext {
  AccessToken(AccessTokenAuthContext),
  OauthClient(OauthClientAuthContext),
  User(UserAuthContext),
  Guest(GuestAuthContext),
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "AccessToken"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct AccessTokenAuthContext {
  pub scope: AuthScope,
  pub client: ShortOauthClient,
  pub user: ShortUser,
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

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "_serde", serde(tag = "type", rename = "OauthClient"))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct OauthClientAuthContext {
  pub scope: AuthScope,
  pub client: ShortOauthClient,
}

declare_new_uuid! {
  pub struct SessionId(Uuid);
  pub type ParseError = SessionIdParseError;
  const SQL_NAME = "session_id";
}

declare_new_uuid! {
  pub struct EtwinOauthAccessTokenKey(Uuid);
  pub type ParseError = EtwinOauthAccessTokenKeyParseError;
  const SQL_NAME = "etwin_oauth_access_token_key";
}

declare_new_enum!(
  pub enum AuthScope {
    #[str("Default")]
    Default,
  }
  pub type ParseError = AuthScopeParseError;
);

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CreateValidatedEmailVerificationOptions {
  pub user: UserIdRef,
  pub email: EmailAddress,
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_instant"))]
  pub token_issued_at: Instant,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CreateSessionOptions {
  pub user: UserIdRef,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawSession {
  pub id: SessionId,
  pub user: UserIdRef,
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_instant"))]
  pub ctime: Instant,
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_instant"))]
  pub atime: Instant,
}

impl RawSession {
  pub fn into_session(self, user_display_name: UserDisplayNameVersions) -> Session {
    Session {
      id: self.id,
      user: ShortUser {
        id: self.user.id,
        display_name: user_display_name,
      },
      ctime: self.ctime,
      atime: self.atime,
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Session {
  pub id: SessionId,
  pub user: ShortUser,
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_instant"))]
  pub ctime: Instant,
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_instant"))]
  pub atime: Instant,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserAndSession {
  pub user: ShortUser,
  pub is_administrator: bool,
  pub session: Session,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawUserCredentials {
  pub login: String,
  pub password: Password,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UserCredentials {
  pub login: UserLogin,
  pub password: Password,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum UserLogin {
  EmailAddress(EmailAddress),
  Username(Username),
}

impl FromStr for UserLogin {
  type Err = ();

  fn from_str(input: &str) -> Result<Self, Self::Err> {
    match EmailAddress::from_str(input) {
      Ok(email) => Ok(Self::EmailAddress(email)),
      Err(_) => match Username::from_str(input) {
        Ok(username) => Ok(Self::Username(username)),
        Err(_) => Err(()),
      },
    }
  }
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RawCredentials {
  pub login: String,
  pub password: Password,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Credentials {
  pub login: Login,
  pub password: Password,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum Login {
  EmailAddress(EmailAddress),
  Username(Username),
  UserId(UserId),
  OauthClientId(OauthClientId),
  OauthClientKey(OauthClientKey),
  UntypedUuid(Uuid),
}

impl FromStr for Login {
  type Err = ();

  fn from_str(input: &str) -> Result<Self, Self::Err> {
    const USER_SUFFIX: &str = "@users";
    const CLIENT_SUFFIX: &str = "@clients";
    if let Some(input) = input.strip_suffix(USER_SUFFIX) {
      if let Ok(id) = UserId::from_str(input) {
        Ok(Login::UserId(id))
      } else if let Ok(username) = Username::from_str(input) {
        Ok(Login::Username(username))
      } else {
        Err(())
      }
    } else if let Some(bare_input) = input.strip_suffix(CLIENT_SUFFIX) {
      if let Ok(client_key) = OauthClientKey::from_str(input) {
        Ok(Login::OauthClientKey(client_key))
      } else if let Ok(id) = OauthClientId::from_str(bare_input) {
        Ok(Login::OauthClientId(id))
      } else {
        Err(())
      }
    } else if let Ok(email) = EmailAddress::from_str(input) {
      Ok(Login::EmailAddress(email))
    } else if let Ok(username) = Username::from_str(input) {
      Ok(Login::Username(username))
    } else if let Ok(uuid) = Uuid::from_str(input) {
      Ok(Login::UntypedUuid(uuid))
    } else {
      Err(())
    }
  }
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait AuthStore: Send + Sync {
  async fn create_validated_email_verification(
    &self,
    options: &CreateValidatedEmailVerificationOptions,
  ) -> Result<(), EtwinError>;

  async fn create_session(&self, options: &CreateSessionOptions) -> Result<RawSession, EtwinError>;

  async fn get_and_touch_session(&self, session: SessionId) -> Result<Option<RawSession>, EtwinError>;
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RegisterOrLoginWithEmailOptions {
  /// Email address for the new user (may be potentially invalid).
  pub email: EmailAddress,
  /// Preferred locale for the verification email.
  pub locale: Option<LocaleId>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct GrantOauthAuthorizationOptions {
  pub client_ref: Option<String>,
  pub redirect_uri: Option<String>,
  pub response_type: Option<String>,
  pub scope: Option<String>,
  pub state: Option<String>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CreateAccessTokenOptions {
  // pub client_ref: Option<String>,
  // pub client_secret: Option<Password>,
  // pub redirect_uri: Option<String>,
  pub code: Option<String>,
  // pub grant_type: Option<String>,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RegisterWithVerifiedEmailOptions {
  pub email_token: String,
  pub display_name: UserDisplayName,
  pub password: Password,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RegisterWithUsernameOptions {
  pub username: Username,
  pub display_name: UserDisplayName,
  pub password: Password,
}

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
