use clap::Clap;
use etwin_cli::cmd::dump;

#[tokio::main]
async fn main() {
  let args: dump::DumpArgs = dump::DumpArgs::parse();

  let res = dump::run(&args).await;

  match res {
    Err(e) => {
      eprintln!("{}", e);
    }
    Ok(()) => {}
  }
}
