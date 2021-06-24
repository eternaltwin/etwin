use clap::Clap;
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
  /// Generate Kotlin definitions
  #[clap(name = "kotlin")]
  Kotlin(KotlinArgs),
}

/// Arguments to the `docs` task.
#[derive(Debug, Clap)]
struct DocsArgs {}

/// Arguments to the `kotlin` task.
#[derive(Debug, Clap)]
struct KotlinArgs {}

fn main() {
  let args: CliArgs = CliArgs::parse();

  let res = match &args.task {
    Task::Docs(ref args) => docs(args),
    Task::Kotlin(ref args) => kotlin(args),
  };

  match res {
    Ok(_) => std::process::exit(0),
    Err(_) => res.unwrap(),
  }
}

fn docs(_args: &DocsArgs) -> Result<(), Box<dyn Error>> {
  xtask::docs()
}

fn kotlin(_args: &KotlinArgs) -> Result<(), Box<dyn Error>> {
  xtask::kotlin()
}
