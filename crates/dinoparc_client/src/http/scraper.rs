use crate::http::errors::ScraperError;
use etwin_core::dinoparc::{DinoparcServer, DinoparcUserId, DinoparcUsername};
use etwin_scraper_tools::ElementRefExt;
use itertools::Itertools;
use once_cell::sync::Lazy;
use percent_encoding::percent_decode_str;
use regex::Regex;
use scraper::{ElementRef, Html, Selector};
#[cfg(test)]
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::str::FromStr;

#[cfg_attr(test, derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub(crate) struct BankScraping {
  pub user_id: DinoparcUserId,
  pub context: ContextScraping,
}

#[cfg_attr(test, derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub(crate) struct ContextScraping {
  pub server: DinoparcServer,
  #[cfg_attr(test, serde(rename = "self"))]
  pub auth: SelfScraping,
}

#[cfg_attr(test, derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub(crate) struct SelfScraping {
  pub username: DinoparcUsername,
}

pub(crate) fn scrape_bank(doc: &Html) -> Result<BankScraping, ScraperError> {
  // Regular expression for the one-argument cashFrame.launch call.
  // Matches `cashFrame.launch("...")`
  static CASH_FRAME_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"cashFrame\.launch\(("(?:[^"\\]|\\.)*")\)"#).unwrap());

  let root = doc.root_element();

  let context = scrape_context(root)?;

  let selector = Selector::parse("script[type=\"text/javascript\"]").unwrap();
  let mut ids = root
    .select(&selector)
    .filter_map(|e| match e.get_one_text() {
      Ok(t) => CASH_FRAME_RE.captures(t),
      Err(_) => None,
    })
    .map(|c| -> Result<DinoparcUserId, ScraperError> {
      // Unwrapping here is ok because we know that `CASH_FRAME_RE` has 1 capture group.
      let raw_cash_frame_arg = c.get(1).unwrap().as_str();
      let cash_frame_options = parse_cash_frame_arg(&raw_cash_frame_arg);
      let cash_frame_options = match cash_frame_options {
        Ok(cfo) => cfo,
        Err(e) => {
          return Err(ScraperError::UnexpectedCashFrameArgument(
            raw_cash_frame_arg.to_string(),
            e,
          ))
        }
      };
      let user_id = cash_frame_options.get("userId");
      match user_id {
        Some(user_id) => {
          DinoparcUserId::from_str(user_id).map_err(|e| ScraperError::InvalidUserId(user_id.to_string(), e))
        }
        None => Err(ScraperError::UnexpectedCashFrameArgument(
          raw_cash_frame_arg.to_string(),
          "missing userId",
        )),
      }
    });
  let id = match (ids.next(), ids.next()) {
    (Some(Ok(id)), None) => id,
    (Some(Err(e)), None) => return Err(e),
    _ => return Err(ScraperError::NonUniqueCashFrameCall),
  };
  Ok(BankScraping { user_id: id, context })
}

fn parse_cash_frame_arg(arg: &str) -> Result<HashMap<String, String>, &'static str> {
  // `arg` is a JS string literal, we take a shortcut and parse it with a JSON parser instead...
  let arg: String = match serde_json::from_str(arg) {
    Ok(arg) => arg,
    Err(_) => return Err("CashFrameArgParseError: Expected JS string litteral"),
  };
  let mut res = HashMap::new();
  for pair in arg.split(';') {
    if let Some((key, value)) = str_split_once(pair, "=") {
      let key = percent_decode_str(key).decode_utf8();
      let value = percent_decode_str(value).decode_utf8();
      match (key, value) {
        (Ok(key), Ok(value)) => res.insert(key.to_string(), value.to_string()),
        _ => return Err("CashFrameArgDecodeError"),
      };
    }
  }
  Ok(res)
}

fn scrape_context(doc: ElementRef) -> Result<ContextScraping, ScraperError> {
  let html = match doc.value().name() {
    "html" => doc,
    _ => return Err(ScraperError::NonUniqueHtml),
  };

  let server = match html.value().attr("lang") {
    Some("en") => DinoparcServer::EnDinoparcCom,
    Some("es") => DinoparcServer::SpDinoparcCom,
    Some("fr") => DinoparcServer::DinoparcCom,
    _ => return Err(ScraperError::ServerDetectionFailure),
  };

  let auth = scrape_sidebar(doc)?;

  Ok(ContextScraping { server, auth })
}

fn scrape_sidebar(doc: ElementRef) -> Result<SelfScraping, ScraperError> {
  let menu = match doc
    .select(&Selector::parse("td.leftPane>div.menu").unwrap())
    .exactly_one()
  {
    Ok(menu) => menu,
    Err(_) => return Err(ScraperError::NonUniqueMenu),
  };

  let titles = menu
    .select(&Selector::parse(":scope > div.title").unwrap())
    .collect_vec();

  let username = match titles.first() {
    Some(e) => *e,
    None => return Err(ScraperError::NonUniqueUsername),
  };

  let username = username
    .get_one_text()
    .map_err(|_| ScraperError::NonUniqueUsernameText)?;
  let username =
    DinoparcUsername::from_str(&username).map_err(|e| ScraperError::InvalidUsername(username.to_string(), e))?;

  Ok(SelfScraping { username })
}

/// Reimplementation of `str.split_once`
/// TODO: Remove it once rust-lang/rust#74773 is stable
fn str_split_once<'a>(s: &'a str, delimiter: &'a str) -> Option<(&'a str, &'a str)> {
  s.find(delimiter).map(|idx| (&s[..idx], &s[(idx + delimiter.len())..]))
}

#[cfg(test)]
mod test {
  use crate::http::scraper::{scrape_bank, BankScraping};
  use scraper::Html;
  use std::path::{Path, PathBuf};
  use test_generator::test_resources;

  #[test_resources("./test-resources/scraping/dinoparc/bank/*/")]
  fn verify_resource(path: &str) {
    let path: PathBuf = Path::join(Path::new("../.."), path);
    let value_path = path.join("value.json");
    let html_path = path.join("main.utf8.html");
    let actual_path = path.join("rs.actual.json");

    let raw_html = ::std::fs::read_to_string(html_path).expect("Failed to read html file");

    let html = Html::parse_document(&raw_html);

    let actual = scrape_bank(&html).unwrap();
    let actual_json = serde_json::to_string_pretty(&actual).unwrap();
    ::std::fs::write(actual_path, format!("{}\n", actual_json)).expect("Failed to write actual file");

    let value_json = ::std::fs::read_to_string(value_path).expect("Failed to read value file");
    let expected = serde_json::from_str::<BankScraping>(&value_json).expect("Failed to parse value file");

    assert_eq!(actual, expected);
  }
}
