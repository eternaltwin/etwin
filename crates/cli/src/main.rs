use clap::Clap;
use etwin_cli::{run, CliArgs};

#[tokio::main]
async fn main() {
  let args: CliArgs = CliArgs::parse();

  let res = run(&args).await;

  match res {
    Err(e) => {
      eprintln!("{}", e);
    }
    Ok(()) => {}
  }
}
