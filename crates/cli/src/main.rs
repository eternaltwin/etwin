use dialoguer::{theme::ColorfulTheme, Input, Password, Select};
use etwin_core::clock::SystemClock;
use etwin_core::dinoparc::{DinoparcClient, DinoparcCredentials, DinoparcPassword, DinoparcServer, DinoparcUsername};
use etwin_dinoparc_client::http::HttpDinoparcClient;
use std::str::FromStr;

#[tokio::main]
async fn main() {
  let servers = vec!["dinoparc.com", "en.dinoparc.com", "sp.dinoparc.com"];
  let server = Select::with_theme(&ColorfulTheme::default())
    .with_prompt("Dinoparc server?")
    .items(&servers)
    .default(0)
    .interact_opt()
    .unwrap();

  let server = match server {
    Some(0) => DinoparcServer::DinoparcCom,
    Some(1) => DinoparcServer::EnDinoparcCom,
    Some(2) => DinoparcServer::SpDinoparcCom,
    _ => panic!("Failed to select server"),
  };

  let username: String = Input::with_theme(&ColorfulTheme::default())
    .with_prompt("Username?")
    .interact_text()
    .unwrap();

  let username = DinoparcUsername::from_str(&username).unwrap();

  let password: String = Password::with_theme(&ColorfulTheme::default())
    .with_prompt("Password?")
    .interact()
    .unwrap();

  let password = DinoparcPassword::new(password);

  let credentials = DinoparcCredentials {
    server,
    username,
    password,
  };

  let clock = SystemClock;
  let dinoparc_client = HttpDinoparcClient::new(clock).unwrap();
  let session = dinoparc_client.create_session(&credentials).await.unwrap();
  dbg!(session);
}
