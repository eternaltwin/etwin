use crate::http::errors::ScraperError;
use etwin_core::dinorpg::{DinorpgProfile, DinorpgProfileResponse, DinorpgServer, ShortDinorpgUser};
use scraper::{ElementRef, Html};

#[derive(Debug)]
struct ScraperContext {
  server: DinorpgServer,
  // session: Option<todo!()>,
}

fn scrape_context(_doc: ElementRef) -> Result<ScraperContext, ScraperError> {
  // TODO: Detect the server
  let server = DinorpgServer::DinorpgCom;
  Ok(ScraperContext { server })
}

pub(crate) fn scrape_profile(doc: &Html) -> Result<DinorpgProfileResponse, ScraperError> {
  let root = doc.root_element();

  let ScraperContext { server } = scrape_context(root)?;

  let profile = DinorpgProfile {
    user: ShortDinorpgUser {
      server,
      id: "0".parse().unwrap(),
      display_name: "todo".parse().unwrap(),
    },
  };

  Ok(DinorpgProfileResponse { profile })
}

#[cfg(test)]
mod test {
  use crate::http::scraper::scrape_profile;
  use etwin_core::dinorpg::DinorpgProfileResponse;
  use scraper::Html;
  use std::path::{Path, PathBuf};
  use test_generator::test_resources;

  #[test_resources("./test-resources/scraping/dinorpg/user/*/")]
  fn test_scrape_profile(path: &str) {
    let path: PathBuf = Path::join(Path::new("../.."), path);
    let value_path = path.join("value.json");
    let html_path = path.join("main.html");
    let actual_path = path.join("rs.actual.json");

    let raw_html = ::std::fs::read_to_string(html_path).expect("Failed to read html file");

    let html = Html::parse_document(&raw_html);

    let actual = scrape_profile(&html).unwrap();
    let actual_json = serde_json::to_string_pretty(&actual).unwrap();
    ::std::fs::write(actual_path, format!("{}\n", actual_json)).expect("Failed to write actual file");

    let value_json = ::std::fs::read_to_string(value_path).expect("Failed to read value file");
    let expected = serde_json::from_str::<DinorpgProfileResponse>(&value_json).expect("Failed to parse value file");

    assert_eq!(actual, expected);
  }
}
