use clap::Clap;
use std::error::Error;
use xtask::{DnsArgs, PublishArgs};

#[derive(Debug, Clap)]
#[clap(author = "Eternaltwin")]
struct CliArgs {
  #[clap(subcommand)]
  task: Task,
}

#[derive(Debug, Clap)]
enum Task {
  /// Refresh generated DNS files
  #[clap(name = "dns")]
  Dns(DnsArgs),
  /// Compile documentation into Angular
  #[clap(name = "docs")]
  Docs(DocsArgs),
  /// Generate Kotlin definitions
  #[clap(name = "kotlin")]
  Kotlin(KotlinArgs),
  /// Generate PHP definitions
  #[clap(name = "php")]
  Php(PhpArgs),
  /// Publish the CLI and all its dependencies
  #[clap(name = "publish")]
  Publish(PublishArgs),
}

/// Arguments to the `docs` task.
#[derive(Debug, Clap)]
struct DocsArgs {}

/// Arguments to the `kotlin` task.
#[derive(Debug, Clap)]
struct KotlinArgs {}

/// Arguments to the `php` task.
#[derive(Debug, Clap)]
struct PhpArgs {}

fn main() {
  let args: CliArgs = CliArgs::parse();

  let res = match &args.task {
    Task::Dns(ref args) => dns(args),
    Task::Docs(ref args) => docs(args),
    Task::Kotlin(ref args) => kotlin(args),
    Task::Php(ref args) => php(args),
    Task::Publish(ref args) => publish(args),
  };

  match res {
    Ok(_) => std::process::exit(0),
    Err(_) => res.unwrap(),
  }
}

fn dns(args: &DnsArgs) -> Result<(), Box<dyn Error>> {
  xtask::dns(args)
}

fn docs(_args: &DocsArgs) -> Result<(), Box<dyn Error>> {
  xtask::docs()
}

fn kotlin(_args: &KotlinArgs) -> Result<(), Box<dyn Error>> {
  xtask::kotlin()
}

fn php(_args: &PhpArgs) -> Result<(), Box<dyn Error>> {
  xtask::php()
}

fn publish(args: &PublishArgs) -> Result<(), Box<dyn Error>> {
  xtask::publish(args)
}
