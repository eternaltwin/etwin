use clap::Clap;
use dialoguer::{theme::ColorfulTheme, Input};
use etwin_core::clock::SystemClock;
use etwin_core::oauth::RfcOauthAccessTokenKey;
use etwin_core::twinoid::api::ConstUserQuery;
use etwin_core::twinoid::{TwinoidApiAuth, TwinoidClient};
use etwin_core::types::AnyError;
use etwin_twinoid_client::http::HttpTwinoidClient;

/// Arguments to the `twinoid` task.
#[derive(Debug, Clap)]
pub struct TwinoidArgs {}

pub async fn run(_args: &TwinoidArgs) -> Result<(), AnyError> {
  let token: String = Input::with_theme(&ColorfulTheme::default())
    .with_prompt("Access token?")
    .interact_text()
    .unwrap();

  let token: RfcOauthAccessTokenKey = token.parse()?;

  let auth = TwinoidApiAuth::Token(token);

  let clock = SystemClock;
  let twinoid_client = HttpTwinoidClient::new(clock).unwrap();

  eprintln!("Fetching `me`");
  let me = twinoid_client.get_me(auth, &ConstUserQuery::<true, true>).await?;
  eprintln!("Fetched `me`:");
  eprintln!("{:#?}", &me);

  Ok(())
}
