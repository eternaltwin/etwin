use chrono::{Duration, TimeZone, Utc};
use etwin_core::api::ApiRef;
use etwin_core::clock::{Clock, VirtualClock};
use etwin_core::core::{LocaleId, Secret};
use etwin_core::hammerfest::{
  HammerfestClient, HammerfestCredentials, HammerfestPassword, HammerfestServer, HammerfestStore,
};
use etwin_core::link::LinkStore;
use etwin_core::user::{ShortUser, UserDisplayNameVersion, UserDisplayNameVersions, UserStore};
use etwin_core::uuid::Uuid4Generator;
use etwin_db_schema::force_create_latest;
use etwin_hammerfest_client::MemHammerfestClient;
use etwin_hammerfest_store::pg::PgHammerfestStore;
use etwin_link_store::pg::PgLinkStore;
use etwin_user_store::pg::PgUserStore;
use serial_test::serial;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;
use std::sync::Arc;

use etwin_auth_store::pg::PgAuthStore;
use etwin_core::auth::{
  AuthStore, RawUserCredentials, RegisterOrLoginWithEmailOptions, RegisterWithUsernameOptions,
  RegisterWithVerifiedEmailOptions, Session, UserAndSession,
};
use etwin_core::dinoparc::{DinoparcClient, DinoparcStore};
use etwin_core::email::{EmailAddress, EmailFormatter, Mailer, VerifyRegistrationEmail};
use etwin_core::oauth::OauthProviderStore;
use etwin_core::password::{Password, PasswordService};
use etwin_core::twinoid::{TwinoidClient, TwinoidStore};
use etwin_dinoparc_client::mem::MemDinoparcClient;
use etwin_dinoparc_store::pg::PgDinoparcStore;
use etwin_email_formatter::json::{JsonBody, JsonEmailFormatter};
use etwin_mailer::mem::MemMailer;
use etwin_oauth_provider_store::pg::PgOauthProviderStore;
use etwin_password::scrypt::ScryptPasswordService;
use etwin_services::auth::{AuthService, DynAuthService};
use etwin_twinoid_client::mem::MemTwinoidClient;
use etwin_twinoid_store::pg::PgTwinoidStore;

macro_rules! assert_ok {
  ($result:expr $(,)?) => {{
    match &$result {
      Err(_) => {
        panic!("assertion failed: `result.is_ok()`: {:?}", &$result)
      }
      Ok(()) => {}
    }
  }};
}

async fn make_test_api(
) -> TestApi<Arc<DynAuthService>, Arc<VirtualClock>, Arc<MemHammerfestClient<Arc<VirtualClock>>>, Arc<MemMailer>> {
  let config = etwin_config::find_config(std::env::current_dir().unwrap()).unwrap();
  let admin_database: PgPool = PgPoolOptions::new()
    .max_connections(5)
    .connect_with(
      PgConnectOptions::new()
        .host(&config.db.host)
        .port(config.db.port)
        .database(&config.db.name)
        .username(&config.db.admin_user)
        .password(&config.db.admin_password),
    )
    .await
    .unwrap();
  force_create_latest(&admin_database, true).await.unwrap();
  admin_database.close().await;

  let database: PgPool = PgPoolOptions::new()
    .max_connections(5)
    .connect_with(
      PgConnectOptions::new()
        .host(&config.db.host)
        .port(config.db.port)
        .database(&config.db.name)
        .username(&config.db.user)
        .password(&config.db.password),
    )
    .await
    .unwrap();
  let database = Arc::new(database);
  let database_secret = Secret::new("dev_secret".to_string());
  let auth_secret: Vec<u8> = "dev_secret".as_bytes().to_vec();

  let uuid_generator = Arc::new(Uuid4Generator);
  let clock: Arc<VirtualClock> = Arc::new(VirtualClock::new(Utc.timestamp(1607531946, 0)));

  let hammerfest_client: Arc<MemHammerfestClient<Arc<VirtualClock>>> =
    Arc::new(MemHammerfestClient::new(Arc::clone(&clock)));
  let dinoparc_client: Arc<dyn DinoparcClient> = Arc::new(MemDinoparcClient::new(Arc::clone(&clock)));
  let twinoid_client: Arc<dyn TwinoidClient> = Arc::new(MemTwinoidClient);

  let hammerfest_store: Arc<dyn HammerfestStore> = Arc::new(
    PgHammerfestStore::new(
      Arc::clone(&clock),
      Arc::clone(&database),
      database_secret.clone(),
      Arc::clone(&uuid_generator),
    )
    .await
    .unwrap(),
  );
  let dinoparc_store: Arc<dyn DinoparcStore> = Arc::new(
    PgDinoparcStore::new(Arc::clone(&clock), Arc::clone(&database), Arc::clone(&uuid_generator))
      .await
      .unwrap(),
  );
  let twinoid_store: Arc<dyn TwinoidStore> = Arc::new(PgTwinoidStore::new(Arc::clone(&clock), Arc::clone(&database)));

  let link_store: Arc<dyn LinkStore> = Arc::new(PgLinkStore::new(Arc::clone(&clock), Arc::clone(&database)));
  let user_store: Arc<dyn UserStore> = Arc::new(PgUserStore::new(
    Arc::clone(&clock),
    Arc::clone(&database),
    database_secret.clone(),
    Arc::clone(&uuid_generator),
  ));

  let email_formatter: Arc<JsonEmailFormatter> = Arc::new(JsonEmailFormatter);
  let mailer = Arc::new(MemMailer::new());

  let password_service = Arc::new(ScryptPasswordService::recommended_for_tests());

  let auth_store: Arc<dyn AuthStore> = Arc::new(PgAuthStore::new(
    Arc::clone(&clock),
    Arc::clone(&database),
    Arc::clone(&uuid_generator),
    database_secret.clone(),
  ));
  let oauth_provider_store: Arc<dyn OauthProviderStore> = Arc::new(PgOauthProviderStore::new(
    Arc::clone(&clock),
    Arc::clone(&database),
    Arc::clone(&password_service),
    Arc::clone(&uuid_generator),
    database_secret.clone(),
  ));

  let auth: Arc<DynAuthService> = Arc::new(AuthService::new(
    Arc::clone(&auth_store),
    Arc::clone(&clock) as Arc<dyn Clock>,
    Arc::clone(&dinoparc_client),
    Arc::clone(&dinoparc_store),
    Arc::clone(&email_formatter) as Arc<dyn EmailFormatter>,
    Arc::clone(&hammerfest_client) as Arc<dyn HammerfestClient>,
    Arc::clone(&hammerfest_store),
    Arc::clone(&link_store),
    Arc::clone(&mailer) as Arc<dyn Mailer>,
    Arc::clone(&oauth_provider_store),
    Arc::clone(&password_service) as Arc<dyn PasswordService>,
    Arc::clone(&user_store),
    Arc::clone(&twinoid_client),
    Arc::clone(&twinoid_store),
    auth_secret,
  ));

  TestApi {
    auth,
    clock,
    hammerfest_client,
    mailer,
  }
}

struct TestApi<TyAuth, TyClock, TyHammerfest, TyMailer>
where
  TyAuth: ApiRef<DynAuthService>,
  TyClock: ApiRef<VirtualClock>,
  TyHammerfest: ApiRef<MemHammerfestClient<TyClock>>,
  TyMailer: ApiRef<MemMailer>,
{
  pub(crate) auth: TyAuth,
  pub(crate) clock: TyClock,
  pub(crate) hammerfest_client: TyHammerfest,
  pub(crate) mailer: TyMailer,
}

#[tokio::test]
#[serial]
async fn test_register_user_through_mail() {
  register_user_through_mail(make_test_api().await).await;
}

#[tokio::test]
#[serial]
async fn test_register_user_with_username() {
  register_user_with_username(make_test_api().await).await;
}

#[tokio::test]
#[serial]
async fn test_register_user_with_username_and_sign_in() {
  register_user_with_username_and_sign_in(make_test_api().await).await;
}

#[tokio::test]
#[serial]
async fn test_register_user_with_hammerfest() {
  register_user_with_hammerfest(make_test_api().await).await;
}

async fn register_user_through_mail<TyClock>(
  api: TestApi<impl ApiRef<DynAuthService>, TyClock, impl ApiRef<MemHammerfestClient<TyClock>>, impl ApiRef<MemMailer>>,
) where
  TyClock: ApiRef<VirtualClock>,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let alice_email: EmailAddress = "alice@example.com".parse().unwrap();
  api.mailer.as_ref().create_inbox(alice_email.clone());
  api
    .auth
    .as_ref()
    .register_or_login_with_email(&RegisterOrLoginWithEmailOptions {
      email: alice_email.clone(),
      locale: Some(LocaleId::FrFr),
    })
    .await
    .unwrap();
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let token = {
    let mut mailbox = api.mailer.as_ref().read_inbox(&alice_email).into_iter();
    let mail = mailbox.next().unwrap();
    assert!(mailbox.next().is_none());
    assert_eq!(mail.title.as_str(), "verifyRegistrationEmail");

    let body: JsonBody<VerifyRegistrationEmail> = serde_json::from_str(mail.body_text.as_str()).unwrap();

    let token: String = body.data.token;
    token
  };
  let actual = api
    .auth
    .as_ref()
    .register_with_verified_email(&RegisterWithVerifiedEmailOptions {
      email_token: token,
      display_name: "Alice".parse().unwrap(),
      password: Password("aaaaaaaaaa".as_bytes().to_vec()),
    })
    .await
    .unwrap();
  let expected = UserAndSession {
    user: ShortUser {
      id: actual.user.id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: "Alice".parse().unwrap(),
        },
      },
    },
    is_administrator: true,
    session: Session {
      id: actual.session.id,
      user: ShortUser {
        id: actual.user.id,
        display_name: UserDisplayNameVersions {
          current: UserDisplayNameVersion {
            value: "Alice".parse().unwrap(),
          },
        },
      },
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
    },
  };
  assert_eq!(actual, expected);
}

async fn register_user_with_username<TyClock>(
  api: TestApi<impl ApiRef<DynAuthService>, TyClock, impl ApiRef<MemHammerfestClient<TyClock>>, impl ApiRef<MemMailer>>,
) where
  TyClock: ApiRef<VirtualClock>,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  let actual = api
    .auth
    .as_ref()
    .register_with_username(&RegisterWithUsernameOptions {
      username: "alice".parse().unwrap(),
      display_name: "Alice".parse().unwrap(),
      password: Password("aaaaaaaaaa".as_bytes().to_vec()),
    })
    .await
    .unwrap();
  let expected = UserAndSession {
    user: ShortUser {
      id: actual.user.id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: "Alice".parse().unwrap(),
        },
      },
    },
    is_administrator: true,
    session: Session {
      id: actual.session.id,
      user: ShortUser {
        id: actual.user.id,
        display_name: UserDisplayNameVersions {
          current: UserDisplayNameVersion {
            value: "Alice".parse().unwrap(),
          },
        },
      },
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 0),
    },
  };
  assert_eq!(actual, expected);
}

async fn register_user_with_username_and_sign_in<TyClock>(
  api: TestApi<impl ApiRef<DynAuthService>, TyClock, impl ApiRef<MemHammerfestClient<TyClock>>, impl ApiRef<MemMailer>>,
) where
  TyClock: ApiRef<VirtualClock>,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  assert_ok!(api
    .auth
    .as_ref()
    .register_with_username(&RegisterWithUsernameOptions {
      username: "alice".parse().unwrap(),
      display_name: "Alice".parse().unwrap(),
      password: Password("aaaaaaaaaa".as_bytes().to_vec()),
    })
    .await
    .map(drop));
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api
    .auth
    .as_ref()
    .raw_login_with_credentials(&RawUserCredentials {
      login: "alice".to_string(),
      password: Password("aaaaaaaaaa".as_bytes().to_vec()),
    })
    .await
    .unwrap();
  let expected = UserAndSession {
    user: ShortUser {
      id: actual.user.id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: "Alice".parse().unwrap(),
        },
      },
    },
    is_administrator: true,
    session: Session {
      id: actual.session.id,
      user: ShortUser {
        id: actual.user.id,
        display_name: UserDisplayNameVersions {
          current: UserDisplayNameVersion {
            value: "Alice".parse().unwrap(),
          },
        },
      },
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
    },
  };
  assert_eq!(actual, expected);
}

async fn register_user_with_hammerfest<TyClock>(
  api: TestApi<impl ApiRef<DynAuthService>, TyClock, impl ApiRef<MemHammerfestClient<TyClock>>, impl ApiRef<MemMailer>>,
) where
  TyClock: ApiRef<VirtualClock>,
{
  api.clock.as_ref().advance_to(Utc.ymd(2021, 1, 1).and_hms(0, 0, 0));
  api.hammerfest_client.as_ref().create_user(
    HammerfestServer::HammerfestFr,
    "123".parse().unwrap(),
    "alice".parse().unwrap(),
    HammerfestPassword::new("aaaaa".to_string()),
  );
  api.clock.as_ref().advance_by(Duration::seconds(1));
  let actual = api
    .auth
    .as_ref()
    .register_or_login_with_hammerfest(&HammerfestCredentials {
      server: HammerfestServer::HammerfestFr,
      username: "alice".parse().unwrap(),
      password: HammerfestPassword::new("aaaaa".to_string()),
    })
    .await
    .unwrap();
  let expected = UserAndSession {
    user: ShortUser {
      id: actual.user.id,
      display_name: UserDisplayNameVersions {
        current: UserDisplayNameVersion {
          value: "alice".parse().unwrap(),
        },
      },
    },
    is_administrator: true,
    session: Session {
      id: actual.session.id,
      user: ShortUser {
        id: actual.user.id,
        display_name: UserDisplayNameVersions {
          current: UserDisplayNameVersion {
            value: "alice".parse().unwrap(),
          },
        },
      },
      ctime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
      atime: Utc.ymd(2021, 1, 1).and_hms(0, 0, 1),
    },
  };
  assert_eq!(actual, expected);
}
