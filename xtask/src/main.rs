use clap::Clap;
use xtask;
use std::error::Error;

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
}

/// Arguments to the `docs` task.
#[derive(Debug, Clap)]
struct DocsArgs {
}

fn main() {
  let args: CliArgs = CliArgs::parse();

  let res = match &args.task {
    Task::Docs(ref args) => docs(args),
  };

  match res {
    Ok(_) =>  std::process::exit(0),
    Err(_) => res.unwrap(),
  }
}

fn docs(_args: &DocsArgs) -> Result<(), Box<dyn Error>> {
  xtask::docs()
}
