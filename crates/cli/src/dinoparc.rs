use clap::Clap;
use dialoguer::{theme::ColorfulTheme, Input, Password, Select};
use etwin_core::clock::SystemClock;
use etwin_core::dinoparc::{DinoparcClient, DinoparcCredentials, DinoparcPassword, DinoparcServer, DinoparcUsername};
use etwin_core::types::EtwinError;
use etwin_dinoparc_client::http::HttpDinoparcClient;
use etwin_log::NoopLogger;
use std::str::FromStr;
use std::time::Duration;

/// Arguments to the `dinoparc` task.
#[derive(Debug, Clap)]
pub struct DinoparcArgs {}

pub async fn run(_args: &DinoparcArgs) -> Result<(), EtwinError> {
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
  let dinoparc_client = HttpDinoparcClient::new(clock, NoopLogger).unwrap();
  let session = dinoparc_client.create_session(&credentials).await.unwrap();

  eprintln!("AcquiredSession:");
  eprintln!("{:#?}", &session);

  let inv = dinoparc_client.get_inventory(&session).await.unwrap();
  eprintln!("AcquiredInventory:");
  eprintln!("{:#?}", &inv.inventory);

  let collection = dinoparc_client.get_collection(&session).await.unwrap();
  eprintln!("AcquiredCollection:");
  eprintln!("{:#?}", &collection.collection);

  for dino in inv.session_user.dinoz.iter() {
    tokio::time::sleep(Duration::from_millis(100)).await;
    let dinoz = dinoparc_client.get_dinoz(&session, dino.id).await.unwrap();
    eprintln!("AcquiredDinoz:");
    eprintln!("{:#?}", &dinoz);
  }

  Ok(())
}
