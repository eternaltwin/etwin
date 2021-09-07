use chrono::{Duration, NaiveDateTime, Utc};
use etwin_core::auth::{
  AccessTokenAuthContext, AuthContext, AuthScope, AuthStore, CreateAccessTokenOptions, CreateSessionOptions,
  CreateValidatedEmailVerificationOptions, Credentials, EtwinOauthAccessTokenKey, GrantOauthAuthorizationOptions,
  Login, OauthClientAuthContext, RawCredentials, RawUserCredentials, RegisterOrLoginWithEmailOptions,
  RegisterWithUsernameOptions, RegisterWithVerifiedEmailOptions, SessionId, UserAndSession, UserAuthContext,
  UserCredentials, UserLogin,
};
use etwin_core::clock::Clock;
use etwin_core::core::{Instant, LocaleId};
use etwin_core::dinoparc::{DinoparcClient, DinoparcCredentials, DinoparcStore, ShortDinoparcUser};
use etwin_core::email::{EmailAddress, EmailFormatter, Mailer, VerifyRegistrationEmail};
use etwin_core::hammerfest::{HammerfestClient, HammerfestCredentials, HammerfestStore, ShortHammerfestUser};
use etwin_core::link::{GetLinkOptions, LinkStore, TouchLinkOptions};
use etwin_core::oauth::{
  CreateStoredAccessTokenOptions, EtwinOauthScopes, GetOauthAccessTokenOptions, GetOauthClientError,
  GetOauthClientOptions, OauthAccessToken, OauthClientId, OauthClientKey, OauthClientRef, OauthProviderStore,
  RfcOauthAccessTokenKey, RfcOauthResponseType, RfcOauthTokenType, ShortOauthClient, SimpleOauthClient,
};
use etwin_core::password::{Password, PasswordService};
use etwin_core::twinoid::{
  ShortTwinoidUser, TwinoidApiAuth, TwinoidClient, TwinoidStore, TwinoidUserId, TwinoidUserIdRef,
};
use etwin_core::types::AnyError;
use etwin_core::user::{
  CreateUserOptions, GetShortUserOptions, GetUserOptions, GetUserResult, SimpleUser, UserDisplayName, UserEmailRef,
  UserFields, UserId, UserIdRef, UserRef, UserStore, UserUsernameRef,
};
use etwin_core::uuid::UuidGenerator;
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use std::sync::Arc;
use thiserror::Error;
use url::Url;

#[derive(Debug, Serialize, Deserialize)]
struct EmailJwtClaims {
  /// Expiration time (Unix timestamp)
  exp: i64,
  /// Issued at (Unix timestamp)
  iat: i64,
  /// Custom: Email address to validate
  email: EmailAddress,
}

#[derive(Debug, Serialize, Deserialize)]
struct OauthCodeJwtClaims {
  /// The recipients that the JWT is intended for
  aud: Vec<String>,
  /// Expiration time (Unix timestamp)
  exp: i64,
  /// Issued at (Unix timestamp)
  iat: i64,
  /// Issuer
  iss: String,
  /// Subject
  sub: UserId,
  /// Custom: Authorization scopes
  scopes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OauthCodeGrant {
  /// TODO: Remove this field and generate it with a getter
  redirect_uri: Url,
  code: String,
  state: Option<String>,
  callback_uri: Url,
}

#[derive(Error, Debug)]
pub enum GrantOauthAuthorizationError {
  #[error("missing client_id parameter")]
  MissingClientId,
  #[error("invalid client_id parameter")]
  InvalidClientId,
  #[error("provided redirect_uri does not match registered callback_uri")]
  RedirectUriMismatch,
  #[error("oauth client not found: {0:?}")]
  ClientNotFound(OauthClientRef),
  #[error("no authenticated user")]
  Unauthenticated,
  #[error("missing response_type parameter")]
  MissingResponseType,
  #[error("invalid response_type parameter")]
  InvalidResponseType,
  #[error("not yet supported response type")]
  UnsupportedResponseType,
  #[error("invalid scope parameter")]
  InvalidScope,
  #[error(transparent)]
  Other(AnyError),
}

#[derive(Error, Debug)]
pub enum CreateAccessTokenError {
  #[error("missing code parameter")]
  MissingCode,
  #[error("no authenticated client")]
  Unauthenticated,
  #[error("code audience does not match authenticated client")]
  WrongClient,
  #[error(transparent)]
  Other(AnyError),
}

pub struct AuthService<
  TyAuthStore,
  TyClock,
  TyDinoparcClient,
  TyDinoparcStore,
  TyEmailFormatter,
  TyHammerfestClient,
  TyHammerfestStore,
  TyLinkStore,
  TyMailer,
  TyOauthProviderStore,
  TyPasswordService,
  TyTwinoidClient,
  TyTwinoidStore,
  TyUserStore,
  TyUuidGenerator,
> where
  TyAuthStore: AuthStore,
  TyClock: Clock,
  TyDinoparcClient: DinoparcClient,
  TyDinoparcStore: DinoparcStore,
  TyEmailFormatter: EmailFormatter,
  TyHammerfestClient: HammerfestClient,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyMailer: Mailer,
  TyOauthProviderStore: OauthProviderStore,
  TyPasswordService: PasswordService,
  TyTwinoidClient: TwinoidClient,
  TyTwinoidStore: TwinoidStore,
  TyUserStore: UserStore,
  TyUuidGenerator: UuidGenerator,
{
  auth_store: TyAuthStore,
  clock: TyClock,
  dinoparc_client: TyDinoparcClient,
  dinoparc_store: TyDinoparcStore,
  email_formatter: TyEmailFormatter,
  hammerfest_client: TyHammerfestClient,
  hammerfest_store: TyHammerfestStore,
  link_store: TyLinkStore,
  mailer: TyMailer,
  oauth_provider_store: TyOauthProviderStore,
  password_service: TyPasswordService,
  twinoid_client: TyTwinoidClient,
  twinoid_store: TyTwinoidStore,
  user_store: TyUserStore,
  uuid_generator: TyUuidGenerator,
  jwt_secret_key: Vec<u8>,
  default_locale: LocaleId,
  email_verification_validity: Duration,
  authorization_code_validity: Duration,
  access_token_validity: Duration,
}

pub type DynAuthService = AuthService<
  Arc<dyn AuthStore>,
  Arc<dyn Clock>,
  Arc<dyn DinoparcClient>,
  Arc<dyn DinoparcStore>,
  Arc<dyn EmailFormatter>,
  Arc<dyn HammerfestClient>,
  Arc<dyn HammerfestStore>,
  Arc<dyn LinkStore>,
  Arc<dyn Mailer>,
  Arc<dyn OauthProviderStore>,
  Arc<dyn PasswordService>,
  Arc<dyn TwinoidClient>,
  Arc<dyn TwinoidStore>,
  Arc<dyn UserStore>,
  Arc<dyn UuidGenerator>,
>;

impl<
    TyAuthStore,
    TyClock,
    TyDinoparcClient,
    TyDinoparcStore,
    TyEmailFormatter,
    TyHammerfestClient,
    TyHammerfestStore,
    TyLinkStore,
    TyMailer,
    TyOauthProviderStore,
    TyPasswordService,
    TyTwinoidClient,
    TyTwinoidStore,
    TyUserStore,
    TyUuidGenerator: UuidGenerator,
  >
  AuthService<
    TyAuthStore,
    TyClock,
    TyDinoparcClient,
    TyDinoparcStore,
    TyEmailFormatter,
    TyHammerfestClient,
    TyHammerfestStore,
    TyLinkStore,
    TyMailer,
    TyOauthProviderStore,
    TyPasswordService,
    TyTwinoidClient,
    TyTwinoidStore,
    TyUserStore,
    TyUuidGenerator,
  >
where
  TyAuthStore: AuthStore,
  TyClock: Clock,
  TyDinoparcClient: DinoparcClient,
  TyDinoparcStore: DinoparcStore,
  TyEmailFormatter: EmailFormatter,
  TyHammerfestClient: HammerfestClient,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyMailer: Mailer,
  TyOauthProviderStore: OauthProviderStore,
  TyPasswordService: PasswordService,
  TyTwinoidClient: TwinoidClient,
  TyTwinoidStore: TwinoidStore,
  TyUserStore: UserStore,
  TyUuidGenerator: UuidGenerator,
{
  #[allow(clippy::too_many_arguments)]
  pub fn new(
    auth_store: TyAuthStore,
    clock: TyClock,
    dinoparc_client: TyDinoparcClient,
    dinoparc_store: TyDinoparcStore,
    email_formatter: TyEmailFormatter,
    hammerfest_client: TyHammerfestClient,
    hammerfest_store: TyHammerfestStore,
    link_store: TyLinkStore,
    mailer: TyMailer,
    oauth_provider_store: TyOauthProviderStore,
    password_service: TyPasswordService,
    user_store: TyUserStore,
    twinoid_client: TyTwinoidClient,
    twinoid_store: TyTwinoidStore,
    uuid_generator: TyUuidGenerator,
    secret: Vec<u8>,
  ) -> Self {
    Self {
      auth_store,
      clock,
      dinoparc_client,
      dinoparc_store,
      email_formatter,
      hammerfest_client,
      hammerfest_store,
      link_store,
      mailer,
      oauth_provider_store,
      password_service,
      twinoid_client,
      twinoid_store,
      user_store,
      uuid_generator,
      jwt_secret_key: secret,
      default_locale: LocaleId::EnUs,
      email_verification_validity: chrono::Duration::days(1),
      authorization_code_validity: chrono::Duration::minutes(10),
      // TODO: Make it expire!
      access_token_validity: chrono::Duration::seconds(1_000_000_000),
    }
  }

  // TODO: Return enum codeGrant/tokenGrant
  pub async fn grant_oauth_authorization(
    &self,
    acx: &AuthContext,
    options: &GrantOauthAuthorizationOptions,
  ) -> Result<OauthCodeGrant, GrantOauthAuthorizationError> {
    // We start by checking for early errors that may correspond to malicious queries.
    // If the client id is missing, the client does not exist or there is a
    // mismatch on the `redirect_uri`, then we treat it as a
    // malicious request and display the error on our own website (we do not
    // redirect it to the client).
    let client_ref = options
      .client_ref
      .as_ref()
      .ok_or(GrantOauthAuthorizationError::MissingClientId)?;
    let client_ref: OauthClientRef = client_ref
      .parse()
      .map_err(|()| GrantOauthAuthorizationError::InvalidClientId)?;
    let client = self
      .oauth_provider_store
      .get_client(&GetOauthClientOptions { r#ref: client_ref })
      .await
      .map_err(|e| match e {
        GetOauthClientError::NotFound(r) => GrantOauthAuthorizationError::ClientNotFound(r),
        GetOauthClientError::Other(e) => GrantOauthAuthorizationError::Other(e),
      })?;
    if let Some(redirect_uri) = options.redirect_uri.as_ref() {
      if redirect_uri.as_str() != client.callback_uri.as_str() {
        return Err(GrantOauthAuthorizationError::RedirectUriMismatch);
      }
    }

    // We now trust the query enough to report errors to the corresponding
    // client. If an error occurs, we now redirect to the client.

    let scope = options.scope.as_ref();

    let response_type = options
      .response_type
      .as_ref()
      .ok_or(GrantOauthAuthorizationError::MissingResponseType)?;
    let response_type: RfcOauthResponseType = response_type
      .parse()
      .map_err(|_| GrantOauthAuthorizationError::InvalidResponseType)?;

    match response_type {
      RfcOauthResponseType::Token => Err(GrantOauthAuthorizationError::UnsupportedResponseType),
      RfcOauthResponseType::Code => {
        let scopes = match scope {
          Some(scope) => EtwinOauthScopes::from_str(scope).map_err(|()| GrantOauthAuthorizationError::InvalidScope)?,
          None => EtwinOauthScopes::default(),
        };
        let acx = match acx {
          AuthContext::User(acx) => acx,
          _ => return Err(GrantOauthAuthorizationError::Unauthenticated),
        };
        let code = self
          .create_authorization_code(acx.user.id.into(), &client, &scopes)
          .map_err(GrantOauthAuthorizationError::Other)?;
        let redirect_uri = {
          let mut redirect_uri = client.callback_uri.clone();
          {
            let mut query_pairs = redirect_uri.query_pairs_mut();
            query_pairs.append_pair("code", code.as_str());
            if let Some(state) = options.state.as_ref() {
              query_pairs.append_pair("state", state.as_str());
            }
          }
          redirect_uri
        };
        Ok(OauthCodeGrant {
          redirect_uri,
          code,
          state: options.state.clone(),
          callback_uri: client.callback_uri,
        })
      }
    }
  }

  pub async fn create_access_token(
    &self,
    acx: &AuthContext,
    options: &CreateAccessTokenOptions,
  ) -> Result<OauthAccessToken, CreateAccessTokenError> {
    let now = self.clock.now();
    let code = options.code.as_ref().ok_or(CreateAccessTokenError::MissingCode)?;
    let client = match acx {
      AuthContext::OauthClient(ref acx) => &acx.client,
      _ => return Err(CreateAccessTokenError::Unauthenticated),
    };
    let claims = self.read_code_token(code).map_err(CreateAccessTokenError::Other)?;
    // TODO: Check if `redirect_uri` matches
    let client_id_str = client.id.to_string();
    if !claims.aud.iter().any(|aud| aud.as_str() == client_id_str.as_str()) {
      return Err(CreateAccessTokenError::WrongClient);
    }
    // TODO: Use actually secure random (split into id + secret)
    let key: EtwinOauthAccessTokenKey = self.uuid_generator.next().to_string().parse().unwrap();
    let token = self
      .oauth_provider_store
      .create_access_token(&CreateStoredAccessTokenOptions {
        key,
        ctime: now,
        expiration_time: now + self.access_token_validity,
        user: claims.sub.into(),
        client: client.id.into(),
      })
      .await
      .map_err(CreateAccessTokenError::Other)?;
    Ok(OauthAccessToken {
      token_type: RfcOauthTokenType::Bearer,
      access_token: token.key,
      expires_in: self.access_token_validity.num_seconds(),
      refresh_token: None,
    })
  }

  pub async fn authenticate_access_token(&self, token: &EtwinOauthAccessTokenKey) -> Result<AuthContext, AnyError> {
    let token = self
      .oauth_provider_store
      .get_access_token(&GetOauthAccessTokenOptions {
        key: *token,
        touch_accessed_at: true,
      })
      .await?;

    let client = self
      .oauth_provider_store
      .get_client(&GetOauthClientOptions {
        r#ref: OauthClientRef::Id(token.client),
      })
      .await?;

    let user = self
      .user_store
      .get_short_user(&GetShortUserOptions {
        r#ref: UserRef::Id(token.user),
        time: None,
      })
      .await?
      .ok_or_else::<AnyError, _>(|| "NotFound".into())?;

    let client = ShortOauthClient {
      id: client.id,
      key: client.key,
      display_name: client.display_name,
    };

    Ok(AuthContext::AccessToken(AccessTokenAuthContext {
      scope: AuthScope::Default,
      client,
      user,
    }))
  }

  pub async fn register_or_login_with_email(&self, options: &RegisterOrLoginWithEmailOptions) -> Result<(), AnyError> {
    let token = self.create_email_verification_token(&options.email)?;
    let locale = options.locale.unwrap_or(self.default_locale);
    let email_content = self
      .email_formatter
      .verify_registration_email(locale, &VerifyRegistrationEmail { token })
      .await?;
    self.mailer.send_email(&options.email, &email_content).await?;
    Ok(())
  }

  pub async fn register_with_verified_email(
    &self,
    options: &RegisterWithVerifiedEmailOptions,
  ) -> Result<UserAndSession, AnyError> {
    let email_jwt = self.read_email_verification_token(options.email_token.as_str())?;
    let email = email_jwt.email;

    let old_user = self
      .user_store
      .get_short_user(&GetShortUserOptions {
        r#ref: UserRef::Email(UserEmailRef { email: email.clone() }),
        time: None,
      })
      .await?;
    if old_user.is_some() {
      return Err("Conflict: EmailAddressAlreadyInUser".into());
    }
    let display_name = options.display_name.clone();
    let password_hash = self.password_service.hash(options.password.clone());

    let user = self
      .user_store
      .create_user(&CreateUserOptions {
        display_name,
        email: Some(email.clone()),
        username: None,
        password: Some(password_hash),
      })
      .await?;

    self
      .auth_store
      .create_validated_email_verification(&CreateValidatedEmailVerificationOptions {
        user: user.id.into(),
        email,
        token_issued_at: Instant::from_utc(NaiveDateTime::from_timestamp(email_jwt.iat, 0), Utc),
      })
      .await?;

    let session = self
      .auth_store
      .create_session(&CreateSessionOptions { user: user.id.into() })
      .await?
      .into_session(user.display_name.clone());

    let is_administrator = user.is_administrator;

    Ok(UserAndSession {
      user: user.into(),
      is_administrator,
      session,
    })
  }

  pub async fn register_with_username(
    &self,
    options: &RegisterWithUsernameOptions,
  ) -> Result<UserAndSession, AnyError> {
    let old_user = self
      .user_store
      .get_short_user(&GetShortUserOptions {
        r#ref: UserRef::Username(UserUsernameRef {
          username: options.username.clone(),
        }),
        time: None,
      })
      .await?;
    if old_user.is_some() {
      return Err("Conflict: UsernameAlreadyInUse".into());
    }
    let display_name = options.display_name.clone();
    let password_hash = self.password_service.hash(options.password.clone());

    let user = self
      .user_store
      .create_user(&CreateUserOptions {
        display_name,
        email: None,
        username: Some(options.username.clone()),
        password: Some(password_hash),
      })
      .await?;

    let session = self
      .auth_store
      .create_session(&CreateSessionOptions { user: user.id.into() })
      .await?
      .into_session(user.display_name.clone());

    let is_administrator = user.is_administrator;

    Ok(UserAndSession {
      user: user.into(),
      is_administrator,
      session,
    })
  }

  pub async fn raw_login_with_credentials(&self, credentials: &RawUserCredentials) -> Result<UserAndSession, AnyError> {
    let credentials = UserCredentials {
      login: credentials.login.parse().map_err(|()| AnyError::from("BadLogin"))?,
      password: credentials.password.clone(),
    };
    self.login_with_credentials(&credentials).await
  }

  pub async fn login_with_credentials(&self, credentials: &UserCredentials) -> Result<UserAndSession, AnyError> {
    let user_ref = match credentials.login.clone() {
      UserLogin::EmailAddress(email) => UserRef::Email(UserEmailRef { email }),
      UserLogin::Username(username) => UserRef::Username(UserUsernameRef { username }),
    };
    let user = self
      .authenticate_user_with_password(user_ref, credentials.password.clone())
      .await?;

    let session = self
      .auth_store
      .create_session(&CreateSessionOptions { user: user.id.into() })
      .await?
      .into_session(user.display_name.clone());

    let is_administrator = user.is_administrator;

    Ok(UserAndSession {
      user: user.into(),
      is_administrator,
      session,
    })
  }

  pub async fn register_or_login_with_dinoparc(
    &self,
    credentials: &DinoparcCredentials,
  ) -> Result<UserAndSession, AnyError> {
    let dparc_session = self.dinoparc_client.create_session(credentials).await?;
    let link = self
      .link_store
      .get_link_from_dinoparc(&GetLinkOptions {
        remote: dparc_session.user.as_ref(),
        time: None,
      })
      .await?;
    let user_id = if let Some(link) = link.current {
      link.etwin.id
    } else {
      let display_name: UserDisplayName = dparc_session.user.derive_user_display_name();
      let user = self
        .user_store
        .create_user(&CreateUserOptions {
          display_name,
          email: None,
          username: None,
          password: None,
        })
        .await?;
      self.dinoparc_store.touch_short_user(&dparc_session.user).await?;
      self
        .link_store
        .touch_dinoparc_link(&TouchLinkOptions {
          etwin: user.id.into(),
          remote: dparc_session.user.as_ref(),
          linked_by: user.id.into(),
        })
        .await?;
      user.id
    };

    let user = self
      .user_store
      .get_user(&GetUserOptions {
        r#ref: UserRef::Id(UserIdRef { id: user_id }),
        fields: UserFields::Default,
        time: None,
      })
      .await?
      .unwrap();

    let user: SimpleUser = match user {
      GetUserResult::Complete(u) => u.into(),
      GetUserResult::Default(u) => u,
      GetUserResult::Short(_) => unreachable!("AssertionError: Requested `UserFields::Default` but got short response"),
    };

    let session = self
      .auth_store
      .create_session(&CreateSessionOptions { user: user.id.into() })
      .await?
      .into_session(user.display_name.clone());

    let is_administrator = user.is_administrator;

    Ok(UserAndSession {
      user: user.into(),
      is_administrator,
      session,
    })
  }

  pub async fn register_or_login_with_hammerfest(
    &self,
    credentials: &HammerfestCredentials,
  ) -> Result<UserAndSession, AnyError> {
    let hfest_session = self.hammerfest_client.create_session(credentials).await?;
    let link = self
      .link_store
      .get_link_from_hammerfest(&GetLinkOptions {
        remote: hfest_session.user.as_ref(),
        time: None,
      })
      .await?;
    let user_id = if let Some(link) = link.current {
      link.etwin.id
    } else {
      let display_name: UserDisplayName = hfest_session.user.derive_user_display_name();
      let user = self
        .user_store
        .create_user(&CreateUserOptions {
          display_name,
          email: None,
          username: None,
          password: None,
        })
        .await?;
      self.hammerfest_store.touch_short_user(&hfest_session.user).await?;
      self
        .link_store
        .touch_hammerfest_link(&TouchLinkOptions {
          etwin: user.id.into(),
          remote: hfest_session.user.as_ref(),
          linked_by: user.id.into(),
        })
        .await?;
      user.id
    };

    let user = self
      .user_store
      .get_user(&GetUserOptions {
        r#ref: UserRef::Id(UserIdRef { id: user_id }),
        fields: UserFields::Default,
        time: None,
      })
      .await?
      .unwrap();

    let user: SimpleUser = match user {
      GetUserResult::Complete(u) => u.into(),
      GetUserResult::Default(u) => u,
      GetUserResult::Short(_) => unreachable!("AssertionError: Requested `UserFields::Default` but got short response"),
    };

    let session = self
      .auth_store
      .create_session(&CreateSessionOptions { user: user.id.into() })
      .await?
      .into_session(user.display_name.clone());

    let is_administrator = user.is_administrator;

    Ok(UserAndSession {
      user: user.into(),
      is_administrator,
      session,
    })
  }

  pub async fn register_or_login_with_twinoid_oauth(
    &self,
    token: &RfcOauthAccessTokenKey,
  ) -> Result<UserAndSession, AnyError> {
    let tid_user = self
      .twinoid_client
      .get_me_short(TwinoidApiAuth::Token(token.clone()))
      .await?;
    let tid_user = ShortTwinoidUser {
      id: TwinoidUserId::new(tid_user.id)?,
      display_name: tid_user.name,
    };
    let tid_user_ref = TwinoidUserIdRef { id: tid_user.id };
    let link = self
      .link_store
      .get_link_from_twinoid(&GetLinkOptions {
        remote: tid_user_ref,
        time: None,
      })
      .await?;
    let user_id = if let Some(link) = link.current {
      link.etwin.id
    } else {
      let display_name: UserDisplayName = tid_user.derive_user_display_name();
      let user = self
        .user_store
        .create_user(&CreateUserOptions {
          display_name,
          email: None,
          username: None,
          password: None,
        })
        .await?;
      self.twinoid_store.touch_short_user(&tid_user).await?;
      self
        .link_store
        .touch_twinoid_link(&TouchLinkOptions {
          etwin: user.id.into(),
          remote: tid_user_ref,
          linked_by: user.id.into(),
        })
        .await?;
      user.id
    };

    let user = self
      .user_store
      .get_user(&GetUserOptions {
        r#ref: UserRef::Id(UserIdRef { id: user_id }),
        fields: UserFields::Default,
        time: None,
      })
      .await?
      .unwrap();

    let user: SimpleUser = match user {
      GetUserResult::Complete(u) => u.into(),
      GetUserResult::Default(u) => u,
      GetUserResult::Short(_) => unreachable!("AssertionError: Requested `UserFields::Default` but got short response"),
    };

    let session = self
      .auth_store
      .create_session(&CreateSessionOptions { user: user.id.into() })
      .await?
      .into_session(user.display_name.clone());

    let is_administrator = user.is_administrator;

    Ok(UserAndSession {
      user: user.into(),
      is_administrator,
      session,
    })
  }

  pub async fn authenticate_session(&self, session: SessionId) -> Result<Option<UserAndSession>, AnyError> {
    let session = self.auth_store.get_and_touch_session(session).await?;
    let session = match session {
      Some(s) => s,
      None => return Ok(None),
    };

    let user = self
      .user_store
      .get_user(&GetUserOptions {
        r#ref: UserRef::Id(UserIdRef { id: session.user.id }),
        fields: UserFields::Default,
        time: None,
      })
      .await?
      .unwrap();

    let user: SimpleUser = match user {
      GetUserResult::Complete(u) => u.into(),
      GetUserResult::Default(u) => u,
      GetUserResult::Short(_) => unreachable!("AssertionError: Requested `UserFields::Default` but got short response"),
    };

    let session = session.into_session(user.display_name.clone());
    let is_administrator = user.is_administrator;

    Ok(Some(UserAndSession {
      user: user.into(),
      is_administrator,
      session,
    }))
  }

  pub async fn raw_authenticate_credentials(&self, credentials: &RawCredentials) -> Result<AuthContext, AnyError> {
    let credentials = Credentials {
      login: credentials.login.parse().map_err(|()| AnyError::from("BadLogin"))?,
      password: credentials.password.clone(),
    };
    self.authenticate_credentials(credentials).await
  }

  pub async fn authenticate_credentials(&self, credentials: Credentials) -> Result<AuthContext, AnyError> {
    fn from_user(user: SimpleUser) -> AuthContext {
      let is_administrator = user.is_administrator;
      AuthContext::User(UserAuthContext {
        scope: AuthScope::Default,
        user: user.into(),
        is_administrator,
      })
    }

    fn from_client(client: SimpleOauthClient) -> AuthContext {
      AuthContext::OauthClient(OauthClientAuthContext {
        scope: AuthScope::Default,
        client: client.into(),
      })
    }

    match credentials.login {
      Login::EmailAddress(email) => {
        let user = self
          .authenticate_user_with_password(UserRef::Email(UserEmailRef { email }), credentials.password)
          .await?;
        Ok(from_user(user))
      }
      Login::Username(username) => {
        let user = self
          .authenticate_user_with_password(UserRef::Username(UserUsernameRef { username }), credentials.password)
          .await?;
        Ok(from_user(user))
      }
      Login::UserId(user_id) => {
        let user = self
          .authenticate_user_with_password(UserRef::Id(user_id.into()), credentials.password)
          .await?;
        Ok(from_user(user))
      }
      Login::OauthClientId(client_id) => {
        let client = self
          .authenticate_oauth_client(OauthClientRef::Id(client_id.into()), credentials.password)
          .await?;
        Ok(from_client(client))
      }
      Login::OauthClientKey(client_key) => {
        let client = self
          .authenticate_oauth_client(OauthClientRef::Key(client_key.into()), credentials.password)
          .await?;
        Ok(from_client(client))
      }
      Login::UntypedUuid(id) => {
        let user_id = UserId::from(id);
        let client_id = OauthClientId::from(id);
        // TODO: Race both
        let user = self
          .authenticate_user_with_password(UserRef::Id(user_id.into()), credentials.password.clone())
          .await;
        let client = self
          .authenticate_oauth_client(OauthClientRef::Id(client_id.into()), credentials.password)
          .await;
        match (user, client) {
          (Ok(user), _) => Ok(from_user(user)),
          (_, Ok(client)) => Ok(from_client(client)),
          (Err(_), Err(_)) => Err("UserOrClientNotFound".into()),
        }
      }
    }
  }

  async fn authenticate_user_with_password(
    &self,
    user_ref: UserRef,
    password: Password,
  ) -> Result<SimpleUser, AnyError> {
    let user_with_password = self
      .user_store
      .get_user_with_password(&GetUserOptions {
        r#ref: user_ref,
        fields: UserFields::Complete,
        time: None,
      })
      .await?;
    let user_with_password = if let Some(user_with_password) = user_with_password {
      user_with_password
    } else {
      return Err("UserNotFound".into());
    };
    let password_hash = match user_with_password.password {
      Some(password_hash) => password_hash,
      None => return Err("NoPassword".into()),
    };
    let is_match = self.password_service.verify(password_hash, password);
    if !is_match {
      return Err("WrongPassword".into());
    }

    let user: Option<GetUserResult> = self
      .user_store
      .get_user(&GetUserOptions {
        r#ref: UserRef::Id(UserIdRef {
          id: user_with_password.id,
        }),
        fields: UserFields::Default,
        time: None,
      })
      .await?;
    let user = user.expect("UserShouldStillExistAfterPasswordWasVerified");

    let user: SimpleUser = match user {
      GetUserResult::Complete(u) => u.into(),
      GetUserResult::Default(u) => u,
      GetUserResult::Short(_) => unreachable!("AssertionError: Requested `UserFields::Default` but got short response"),
    };

    Ok(user)
  }

  async fn authenticate_oauth_client(
    &self,
    oauth_client_ref: OauthClientRef,
    secret: Password,
  ) -> Result<SimpleOauthClient, AnyError> {
    let client_with_secret = self
      .oauth_provider_store
      .get_client_with_secret(&GetOauthClientOptions {
        r#ref: oauth_client_ref,
      })
      .await?;
    let is_match = self.password_service.verify(client_with_secret.secret, secret);
    if !is_match {
      return Err("WrongSecret".into());
    }

    Ok(SimpleOauthClient {
      id: client_with_secret.id,
      key: client_with_secret.key,
      display_name: client_with_secret.display_name,
      app_uri: client_with_secret.app_uri,
      callback_uri: client_with_secret.callback_uri,
      owner: client_with_secret.owner,
    })
  }

  fn create_email_verification_token(&self, email: &EmailAddress) -> Result<String, AnyError> {
    let now = self.clock.now();
    let expires_at = now + self.email_verification_validity;

    let claims = EmailJwtClaims {
      exp: expires_at.timestamp(),
      iat: now.timestamp(),
      email: email.clone(),
    };

    let key = jsonwebtoken::EncodingKey::from_secret(self.jwt_secret_key.as_slice());

    let token = jsonwebtoken::encode(
      &jsonwebtoken::Header::new(jsonwebtoken::Algorithm::HS256),
      &claims,
      &key,
    )?;
    Ok(token)
  }

  fn read_email_verification_token(&self, token: &str) -> Result<EmailJwtClaims, AnyError> {
    let now = self.clock.now().timestamp();
    let key = jsonwebtoken::DecodingKey::from_secret(self.jwt_secret_key.as_slice());
    let validation = jsonwebtoken::Validation {
      leeway: 0,
      validate_exp: false,
      validate_nbf: false,
      aud: None,
      iss: None,
      sub: None,
      algorithms: vec![jsonwebtoken::Algorithm::HS256],
    };

    let token = jsonwebtoken::decode::<EmailJwtClaims>(token, &key, &validation)?;
    if !(token.claims.iat <= now && now < token.claims.exp) {
      return Err("TokenIsNotValidAtThisTime".into());
    }

    Ok(token.claims)
  }

  /// Create an OAuth authorization code.
  fn create_authorization_code(
    &self,
    user: UserIdRef,
    client: &SimpleOauthClient,
    scopes: &EtwinOauthScopes,
  ) -> Result<String, AnyError> {
    // let mut missing_scopes: HashSet<String> = HashSet::new();
    // let EtwinOauthScopes { base: base_scope } = scopes;
    // TODO: Check for missing scopes and prompt user...
    self.create_code_token(client.id, client.key.as_ref(), user.id, scopes)
  }

  fn create_code_token(
    &self,
    client_id: OauthClientId,
    client_key: Option<&OauthClientKey>,
    user_id: UserId,
    scopes: &EtwinOauthScopes,
  ) -> Result<String, AnyError> {
    let now = self.clock.now();
    let expires_at = now + self.authorization_code_validity;

    let mut aud: Vec<String> = Vec::with_capacity(2);
    aud.push(client_id.to_string());
    if let Some(client_key) = client_key {
      aud.push(client_key.to_string());
    }

    let claims = OauthCodeJwtClaims {
      aud,
      exp: expires_at.timestamp(),
      iat: now.timestamp(),
      iss: "etwin".to_string(),
      sub: user_id,
      scopes: scopes.strings(),
    };

    let key = jsonwebtoken::EncodingKey::from_secret(self.jwt_secret_key.as_slice());

    let token = jsonwebtoken::encode(
      &jsonwebtoken::Header::new(jsonwebtoken::Algorithm::HS256),
      &claims,
      &key,
    )?;
    Ok(token)
  }

  fn read_code_token(&self, token: &str) -> Result<OauthCodeJwtClaims, AnyError> {
    let now = self.clock.now().timestamp();
    let key = jsonwebtoken::DecodingKey::from_secret(self.jwt_secret_key.as_slice());
    let validation = jsonwebtoken::Validation {
      leeway: 0,
      validate_exp: false,
      validate_nbf: false,
      aud: None,
      iss: None,
      sub: None,
      algorithms: vec![jsonwebtoken::Algorithm::HS256],
    };

    let token = jsonwebtoken::decode::<OauthCodeJwtClaims>(token, &key, &validation)?;
    if !(token.claims.iat <= now && now < token.claims.exp) {
      return Err("TokenIsNotValidAtThisTime".into());
    }

    Ok(token.claims)
  }
}

#[cfg(feature = "neon")]
impl<
    TyAuthStore,
    TyClock,
    TyDinoparcClient,
    TyDinoparcStore,
    TyEmailFormatter,
    TyHammerfestClient,
    TyHammerfestStore,
    TyLinkStore,
    TyMailer,
    TyOauthProviderStore,
    TyPasswordService,
    TyTwinoidClient,
    TyTwinoidStore,
    TyUserStore,
    TyUuidGenerator,
  > neon::prelude::Finalize
  for AuthService<
    TyAuthStore,
    TyClock,
    TyDinoparcClient,
    TyDinoparcStore,
    TyEmailFormatter,
    TyHammerfestClient,
    TyHammerfestStore,
    TyLinkStore,
    TyMailer,
    TyOauthProviderStore,
    TyPasswordService,
    TyTwinoidClient,
    TyTwinoidStore,
    TyUserStore,
    TyUuidGenerator,
  >
where
  TyAuthStore: AuthStore,
  TyClock: Clock,
  TyDinoparcClient: DinoparcClient,
  TyDinoparcStore: DinoparcStore,
  TyEmailFormatter: EmailFormatter,
  TyHammerfestClient: HammerfestClient,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyMailer: Mailer,
  TyOauthProviderStore: OauthProviderStore,
  TyPasswordService: PasswordService,
  TyTwinoidClient: TwinoidClient,
  TyTwinoidStore: TwinoidStore,
  TyUserStore: UserStore,
  TyUuidGenerator: UuidGenerator,
{
}

trait DeriverUserDisplayName {
  fn derive_user_display_name(&self) -> UserDisplayName;
}

impl DeriverUserDisplayName for ShortDinoparcUser {
  fn derive_user_display_name(&self) -> UserDisplayName {
    if let Ok(name) = UserDisplayName::from_str(self.username.as_str()) {
      return name;
    }
    if let Ok(name) = UserDisplayName::from_str(format!("dparc_{}", &self.username).as_str()) {
      return name;
    }
    if let Ok(name) = UserDisplayName::from_str(format!("dparc_{}", &self.id).as_str()) {
      return name;
    }
    UserDisplayName::from_str("dparcPlayer").expect("`dparcPlayer` should be a valid `UserDisplayName`")
  }
}

impl DeriverUserDisplayName for ShortHammerfestUser {
  fn derive_user_display_name(&self) -> UserDisplayName {
    if let Ok(name) = UserDisplayName::from_str(self.username.as_str()) {
      return name;
    }
    if let Ok(name) = UserDisplayName::from_str(format!("hf_{}", &self.username).as_str()) {
      return name;
    }
    if let Ok(name) = UserDisplayName::from_str(format!("hf_{}", &self.id).as_str()) {
      return name;
    }
    UserDisplayName::from_str("hfPlayer").expect("`hfPlayer` should be a valid `UserDisplayName`")
  }
}

impl DeriverUserDisplayName for ShortTwinoidUser {
  fn derive_user_display_name(&self) -> UserDisplayName {
    if let Ok(name) = UserDisplayName::from_str(self.display_name.as_str()) {
      return name;
    }
    if let Ok(name) = UserDisplayName::from_str(format!("tid_{}", &self.display_name).as_str()) {
      return name;
    }
    if let Ok(name) = UserDisplayName::from_str(format!("tid_{}", &self.id).as_str()) {
      return name;
    }
    UserDisplayName::from_str("tidPlayer").expect("`tidPlayer` should be a valid `UserDisplayName`")
  }
}
