use std::error::Error;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::thread::sleep;
use std::time::Duration;

const CRATES: [&str; 22] = [
  "postgres_tools",
  "serde_tools",
  "scraper_tools",
  "squirrel",
  "log",
  "core",
  "config",
  "constants",
  "db_schema",
  "populate",
  "password",
  "dinoparc_client",
  "dinoparc_store",
  "hammerfest_client",
  "hammerfest_store",
  "twinoid_store",
  "user_store",
  "token_store",
  "link_store",
  "services",
  "rest",
  "cli",
];

const NPM_PACKAGES: [&str; 24] = [
  "core",
  "announcement-mem",
  "announcement-pg",
  "auth-in-memory",
  "auth-pg",
  "email-console",
  "email-in-memory",
  "email-template-etwin",
  "email-template-json",
  "etwin-client-http",
  "etwin-client-in-memory",
  "etwin-pg",
  "forum-in-memory",
  "forum-pg",
  "local-config",
  "native",
  "oauth-client-http",
  "oauth-provider-in-memory",
  "oauth-provider-pg",
  "pg-db",
  "rest-server",
  "twinoid-client-http",
  "website",
  "cli",
];

pub fn publish() -> Result<(), Box<dyn Error>> {
  let working_dir = std::env::current_dir()?;
  let crates_dir = working_dir.join("crates");
  let packages_dir = working_dir.join("packages");

  for c in std::array::IntoIter::new(CRATES) {
    eprintln!("Publishing: {}", c);
    let mut cmd = Command::new("cargo");
    cmd.current_dir(crates_dir.join(c));
    cmd.arg("publish");
    let s = cmd.status()?;
    assert!(s.success());
    sleep(Duration::from_secs(30));
  }

  for p in std::array::IntoIter::new(NPM_PACKAGES) {
    eprintln!("Publishing: {}", p);
    let dir = packages_dir.join(p);
    if p == "native" {
      publish_npm_native(dir)?;
      continue;
    }
    let mut cmd = Command::new("yarn");
    cmd.current_dir(dir);
    cmd.arg("npm").arg("publish");
    let s = cmd.status()?;
    assert!(s.success());
    sleep(Duration::from_secs(30));
  }

  Ok(())
}

fn publish_npm_native(pkg_dir: PathBuf) -> Result<(), Box<dyn Error>> {
  let dev_toml = fs::read_to_string(pkg_dir.join("native/Cargo.toml"))?;
  let dev_package_json = fs::read_to_string(pkg_dir.join("package.json"))?;

  let publish_toml = dev_toml.replace("\n# [workspace]\n", "\n[workspace]\n");
  assert_ne!(publish_toml, dev_toml);
  let publish_package_json = dev_package_json.replace("\"//install\"", "\"install\"");
  assert_ne!(publish_package_json, dev_package_json);

  fs::write(pkg_dir.join("native/Cargo.toml"), publish_toml)?;
  fs::write(pkg_dir.join("package.json"), publish_package_json)?;

  let mut cmd = Command::new("yarn");
  cmd.current_dir(&pkg_dir);
  cmd.arg("npm").arg("publish");
  let s = cmd.status()?;
  assert!(s.success());
  sleep(Duration::from_secs(30));

  fs::write(pkg_dir.join("native/Cargo.toml"), dev_toml)?;
  fs::write(pkg_dir.join("package.json"), dev_package_json)?;
  Ok(())
}
