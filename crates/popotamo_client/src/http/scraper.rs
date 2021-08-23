use crate::http::errors::ScraperError;
use crate::http::url::PopotamoUrls;
use etwin_core::popotamo::{
  PopotamoProfile, PopotamoProfileResponse, PopotamoServer, PopotamoSessionUser, PopotamoUserId, PopotamoUsername,
  ShortPopotamoUser,
};
use etwin_scraper_tools::selector;
use etwin_scraper_tools::ElementRefExt;
use itertools::Itertools;
use scraper::{ElementRef, Html, Selector};
use std::str::FromStr;

#[derive(Debug)]
struct ScraperContext {
  server: PopotamoServer,
  session: Option<PopotamoSessionUser>,
}

fn scrape_context(doc: ElementRef) -> Result<ScraperContext, ScraperError> {
  // Only the french server is supported
  let server = PopotamoServer::PopotamoCom;

  let session = doc
    .select(selector!("#menu table#sheet"))
    .at_most_one()
    .map_err(|_| ScraperError::DuplicateSessionBox)?;

  let session = if let Some(session) = session {
    let rewards = session
      .select(selector!(":scope div.rewards"))
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueSessionUserRewards)?;
    let user_link = rewards
      .select(selector!(":scope a"))
      .next()
      .ok_or(ScraperError::MissingSessionUserLink)?;

    let user_id_href = user_link.value().attr("href").ok_or(ScraperError::MissingLinkHref)?;
    let user_id = PopotamoUrls::new(server)
      .parse_from_root(user_id_href)
      .map_err(|_| ScraperError::InvalidUserLink(user_id_href.to_string()))?;
    let user_id: Option<&str> = user_id
      .path_segments()
      .into_iter()
      .flat_map(|mut segments| segments.nth(1))
      .next();
    let user_id = user_id.ok_or_else(|| ScraperError::InvalidUserLink(user_id_href.to_string()))?;
    let user_id = PopotamoUserId::from_str(user_id).map_err(|_| ScraperError::InvalidUserId(user_id.to_string()))?;

    let username = user_link
      .get_one_text()
      .map_err(|_| ScraperError::NonUniqueSessionUserLinkText)?;
    let username: PopotamoUsername = username
      .parse()
      .map_err(|_| ScraperError::InvalidUsername(username.to_string()))?;

    Some(PopotamoSessionUser {
      user: ShortPopotamoUser {
        server,
        id: user_id,
        username,
      },
    })
  } else {
    None
  };

  Ok(ScraperContext { server, session })
}

pub(crate) fn scrape_profile(doc: &Html) -> Result<PopotamoProfileResponse, ScraperError> {
  let root = doc.root_element();

  let ScraperContext { server, session } = scrape_context(root)?;

  let profile = PopotamoProfile {
    user: ShortPopotamoUser {
      server,
      id: "0".parse().unwrap(),
      username: "todo".parse().unwrap(),
    },
  };

  Ok(PopotamoProfileResponse {
    session_user: session,
    profile,
  })
}

#[cfg(test)]
mod test {
  use crate::http::scraper::scrape_profile;
  use etwin_core::popotamo::PopotamoProfileResponse;
  use scraper::Html;
  use std::path::{Path, PathBuf};
  use test_generator::test_resources;

  #[test_resources("./test-resources/scraping/popotamo/user/*/")]
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
    let expected = serde_json::from_str::<PopotamoProfileResponse>(&value_json).expect("Failed to parse value file");

    assert_eq!(actual, expected);
  }
}
