use clap::Clap;
use etwin_config::Config;
use etwin_core::types::EtwinError;
use std::env;
use std::error::Error;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use tokio::process::Command;

/// Arguments to the `dump` task.
#[derive(Debug, Clap)]
pub struct DumpArgs {
  /// Output directory
  ///
  /// The parent directory must exist. The output directory itself must be
  /// either missing or empty.
  dir: PathBuf,
}

pub async fn run(args: &DumpArgs) -> Result<(), EtwinError> {
  let pg_dump_exe = "pg_dump";
  let working_dir = env::current_dir()?;
  let out_dir = &args.dir;
  eprintln!("Working directory: {}", working_dir.display());
  eprintln!("Output directory: {}", out_dir.display());
  eprintln!("`pg_dump` executable: {}", pg_dump_exe);
  eprintln!("--");
  eprintln!("Checking output directory...");
  let out_dir_state = check_out_dir(out_dir).map_err(|e| -> EtwinError { e.to_string().as_str().into() })?;
  eprintln!("State: {:?}", out_dir_state);
  match out_dir_state {
    OutDirState::NotADirectory => return Err("Output exists and is not a directory".into()),
    OutDirState::NonEmptyDir => return Err("Output directory is non-empty".into()),
    OutDirState::DoesNotExist => {
      fs::create_dir(out_dir)?;
    }
    OutDirState::EmptyDir => {
      // OK: Already an empty dir
    }
  }
  let out_dir = out_dir.canonicalize()?;
  eprintln!("Resolved output directory: {}", out_dir.display());

  let config: Config = etwin_config::find_config(working_dir.clone()).unwrap();

  let mut cmd = Command::new(pg_dump_exe);
  cmd.current_dir(out_dir);
  cmd.env("PGPASSWORD", config.db.admin_password);
  cmd.arg("--clean");
  cmd.arg("--if-exists");
  cmd.arg("--format").arg("plain");
  cmd.arg("--no-owner");
  cmd.arg("--username").arg(config.db.admin_user);
  cmd.arg("--no-password");
  cmd.arg("--file").arg("etwin.sql");
  cmd.arg("--host").arg(config.db.host);
  cmd.arg("--port").arg(config.db.port.to_string());
  cmd.arg("--dbname").arg(config.db.name);

  let status = cmd.status().await?;

  if status.success() {
    eprintln!("--");
    eprintln!("OK");
    Ok(())
  } else {
    Err("Error on `pg_dump`".into())
  }
}

#[derive(Copy, Clone, Ord, PartialOrd, Eq, PartialEq, Hash, Debug)]
enum OutDirState {
  DoesNotExist,
  NotADirectory,
  EmptyDir,
  NonEmptyDir,
}

fn check_out_dir(dir: &Path) -> Result<OutDirState, Box<dyn Error>> {
  let mut read_dir: fs::ReadDir = match fs::read_dir(dir) {
    Ok(read_dir) => read_dir,
    Err(e) => {
      return match e.kind() {
        io::ErrorKind::NotFound => Ok(OutDirState::DoesNotExist),
        io::ErrorKind::Other if !dir.is_dir() => Ok(OutDirState::NotADirectory),
        _ => Err(e.into()),
      };
    }
  };
  let is_empty = read_dir.next().is_none();
  if is_empty {
    Ok(OutDirState::EmptyDir)
  } else {
    Ok(OutDirState::NonEmptyDir)
  }
}
