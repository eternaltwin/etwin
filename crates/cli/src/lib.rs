use crate::rest::RestArgs;
use clap::Clap;
use etwin_core::types::EtwinError;

pub mod cmd {
  pub mod dinoparc;
  pub mod dump;
  pub mod twinoid;
}
pub mod rest;

#[derive(Debug, Clap)]
#[clap(author = "Eternaltwin")]
pub struct CliArgs {
  #[clap(subcommand)]
  command: CliCommand,
}

#[derive(Debug, Clap)]
pub enum CliCommand {
  /// Run the Dinoparc client demo
  #[clap(name = "dinoparc")]
  Dinoparc(cmd::dinoparc::DinoparcArgs),
  /// Dump the DB state into a directory
  #[clap(name = "dump")]
  Dump(cmd::dump::DumpArgs),
  /// Start REST server
  #[clap(name = "rest")]
  Rest(RestArgs),
  /// Run the Twinoid client demo
  #[clap(name = "twinoid")]
  Twinoid(cmd::twinoid::TwinoidArgs),
}

pub async fn run(args: &CliArgs) -> Result<(), EtwinError> {
  match &args.command {
    CliCommand::Dinoparc(ref args) => cmd::dinoparc::run(args).await,
    CliCommand::Dump(ref args) => cmd::dump::run(args).await,
    CliCommand::Rest(ref args) => crate::rest::run(args).await,
    CliCommand::Twinoid(ref args) => cmd::twinoid::run(args).await,
  }
}
