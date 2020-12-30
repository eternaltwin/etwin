use clap::Clap;
use std::error::Error;
use xtask;

#[derive(Debug, Clap)]
#[clap(author = "Charles \"Demurgos\" Samborski")]
struct CliArgs {
  #[clap(subcommand)]
  task: Task,
}

#[derive(Debug, Clap)]
enum Task {
  /// Compile documentation into Angular
  #[clap(name = "docs")]
  Docs(DocsArgs),
  /// Prepare the SQLx data for offline compilation
  #[clap(name = "sqlx")]
  Sqlx(SqlxArgs),
}

/// Arguments to the `docs` task.
#[derive(Debug, Clap)]
struct DocsArgs {}

/// Arguments to the `sqlx` task.
#[derive(Debug, Clap)]
struct SqlxArgs {}

#[tokio::main]
async fn main() {
  let args: CliArgs = CliArgs::parse();

  let res = match &args.task {
    Task::Docs(ref args) => docs(args),
    Task::Sqlx(ref args) => sqlx(args).await,
  };

  match res {
    Ok(_) => std::process::exit(0),
    Err(_) => res.unwrap(),
  }
}

fn docs(_args: &DocsArgs) -> Result<(), Box<dyn Error>> {
  xtask::docs()
}

async fn sqlx(_args: &SqlxArgs) -> Result<(), Box<dyn Error>> {
  xtask::sqlx().await
}
