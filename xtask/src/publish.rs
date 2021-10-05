use clap::Clap;
use std::error::Error;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::thread::sleep;
use std::time::Duration;

const CRATES: [&str; 31] = [
  "postgres_tools",
  "serde_tools",
  "scraper_tools",
  "squirrel",
  "log",
  "core",
  "config",
  "constants",
  "mt_dns",
  "db_schema",
  "populate",
  "email_formatter",
  "mailer",
  "password",
  "dinoparc_client",
  "dinoparc_store",
  "dinorpg_client",
  "hammerfest_client",
  "hammerfest_store",
  "popotamo_client",
  "twinoid_client",
  "twinoid_store",
  "user_store",
  "oauth_provider_store",
  "auth_store",
  "token_store",
  "link_store",
  "forum_store",
  "services",
  "rest",
  "cli",
];

const NPM_PACKAGES: [&str; 16] = [
  "core",
  "announcement-mem",
  "announcement-pg",
  "etwin-client-http",
  "etwin-client-in-memory",
  "etwin-pg",
  "forum-in-memory",
  "forum-pg",
  "local-config",
  "mt-dns",
  "native",
  "oauth-client-http",
  "pg-db",
  "rest-server",
  "website",
  "cli",
];

/// Arguments to the `publish` task.
#[derive(Debug, Clap)]
pub struct PublishArgs {
  #[clap(long)]
  skip_rust: bool,
}

pub fn publish(args: &PublishArgs) -> Result<(), Box<dyn Error>> {
  let working_dir = std::env::current_dir()?;
  let crates_dir = working_dir.join("crates");
  let packages_dir = working_dir.join("packages");

  if !args.skip_rust {
    for c in std::array::IntoIter::new(CRATES) {
      eprintln!("Publishing: {}", c);
      let mut cmd = Command::new("cargo");
      cmd.current_dir(crates_dir.join(c));
      cmd.arg("publish");
      let s = cmd.status()?;
      assert!(s.success());
      sleep(Duration::from_secs(30));
    }
  }

  for p in std::array::IntoIter::new(NPM_PACKAGES) {
    eprintln!("Publishing: {}", p);
    let dir = packages_dir.join(p);
    match p {
      "etwin-pg" => publish_npm_etwin_pg(dir)?,
      "native" => publish_npm_native(dir)?,
      _ => {
        let mut cmd = Command::new("yarn");
        cmd.current_dir(dir);
        cmd.arg("npm").arg("publish");
        let s = cmd.status()?;
        assert!(s.success());
        sleep(Duration::from_secs(30));
      }
    }
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
  cmd.arg("pack");
  let s = cmd.status()?;
  assert!(s.success());
  let mut cmd = Command::new("npm");
  cmd.current_dir(&pkg_dir);
  cmd.arg("publish").arg("package.tgz");
  let s = cmd.status()?;
  assert!(s.success());
  sleep(Duration::from_secs(30));

  fs::remove_file(pkg_dir.join("native/Cargo.lock"))?;
  fs::remove_file(pkg_dir.join("package.tgz"))?;
  fs::write(pkg_dir.join("native/Cargo.toml"), dev_toml)?;
  fs::write(pkg_dir.join("package.json"), dev_package_json)?;
  Ok(())
}

fn publish_npm_etwin_pg(pkg_dir: PathBuf) -> Result<(), Box<dyn Error>> {
  let scripts = pkg_dir.join("scripts");
  let scripts_tmp = pkg_dir.join("scripts-tmp");
  fs::rename(&scripts, &scripts_tmp)?;
  fs::create_dir(&scripts)?;
  let mut options = fs_extra::dir::CopyOptions::new();
  options.content_only = true;
  fs_extra::dir::copy(&scripts_tmp, &scripts, &options)?;

  let mut cmd = Command::new("yarn");
  cmd.current_dir(&pkg_dir);
  cmd.arg("npm").arg("publish");
  let s = cmd.status()?;
  assert!(s.success());
  sleep(Duration::from_secs(30));

  fs::remove_dir_all(&scripts)?;
  fs::rename(&scripts_tmp, &scripts)?;
  Ok(())
}
