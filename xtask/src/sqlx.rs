use std::error::Error;
use std::env;
use std::fs::read_to_string;
use std::convert::TryInto;
use url::Url;
use sqlx_cli;
use clap::Clap;

pub async fn sqlx() -> Result<(), Box<dyn Error>> {
  let config = get_config();
  let db_url = config.to_db_url().to_string();
  env::set_var("DATABASE_URL", db_url);
  let project_root = env::current_dir().unwrap();
  let crates = project_root.join("crates");
  let sqlx_crates = vec!["etwin_db_schema", "etwin_hammerfest_store", "etwin_squirrel", "etwin_user_store"];
  for sqlx_crate in sqlx_crates {
    env::set_current_dir(crates.join(sqlx_crate)).unwrap();
    let opts = sqlx_cli::Opt::parse_from(vec!["cargo-sqlx", "prepare", "--", "--lib"].into_iter());
    sqlx_cli::run(opts).await.unwrap();
  }
  Ok(())
}

fn get_config() -> DbConfig {
  let dir = env::current_dir().unwrap();
  for d in dir.ancestors() {
    let config_path = d.join("etwin.toml");
    let config_toml = read_to_string(config_path).unwrap();
    let config: toml::Value = config_toml.parse().unwrap();
    let db_config = config.get("db").unwrap();
    let host = db_config.get("host").unwrap().as_str().unwrap().to_string();
    let port: i64 = db_config.get("port").unwrap().as_integer().unwrap();
    let port: u16 = port.try_into().unwrap();
    let name = db_config.get("name").unwrap().as_str().unwrap().to_string();
    let user = db_config.get("user").unwrap().as_str().unwrap().to_string();
    let password = db_config.get("password").unwrap().as_str().unwrap().to_string();
    return DbConfig { host, port, name, user, password };
  }
  panic!("Config file not found: {}", dir.display());
}

#[derive(Debug)]
struct DbConfig {
  host: String,
  port: u16,
  name: String,
  user: String,
  password: String,
}

impl DbConfig {
  fn to_db_url(&self) -> Url {
    let mut url = Url::parse("postgresql://user:password@host:5432/name").unwrap();
    url.set_username(&self.user).unwrap();
    url.set_password(Some(&self.password)).unwrap();
    url.set_host(Some(&self.host)).unwrap();
    url.set_port(Some(self.port)).unwrap();
    url.set_path(&self.name);
    url
  }
}
