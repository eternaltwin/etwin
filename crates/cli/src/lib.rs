use crate::dinoparc::DinoparcArgs;
use crate::rest::RestArgs;
use clap::Clap;
use etwin_core::types::EtwinError;

pub mod cmd {
  pub mod dump;
}
pub mod dinoparc;
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
  Dinoparc(DinoparcArgs),
  /// Start REST server
  #[clap(name = "rest")]
  Rest(RestArgs),
}

pub async fn run(args: &CliArgs) -> Result<(), EtwinError> {
  match &args.command {
    CliCommand::Dinoparc(ref args) => crate::dinoparc::run(args).await,
    CliCommand::Rest(ref args) => crate::rest::run(args).await,
  }
}
