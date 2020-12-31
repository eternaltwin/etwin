
use etwin_core::hammerfest::*;
use scraper::{ Selector, ElementRef };
use once_cell::sync::Lazy;

use super::errors::ScraperError;

pub type Html = scraper::Html;

fn selector_to_string(selector: &Selector) -> String {
  use cssparser::ToCss;
  selector.selectors.iter()
    .map(|sel| sel.to_css_string())
    .collect::<Vec<_>>()
    .join(", ")
}

fn select_one_opt<'a>(node: &ElementRef<'a>, selector: &Selector) -> Result<Option<ElementRef<'a>>, ScraperError> {
  let mut it = node.select(selector);
  match (it.next(), it.next()) {
    (None, _) => Ok(None),
    (Some(first), None) => Ok(Some(first)),
    (Some(_), Some(_)) => Err(ScraperError::TooManyHtmlFragments(selector_to_string(selector))),
  }
}

fn select_one<'a>(node: &ElementRef<'a>, selector: &Selector) -> Result<ElementRef<'a>, ScraperError> {
  match select_one_opt(node, selector) {
    Ok(None) => Err(ScraperError::HtmlFragmentNotFound(selector_to_string(selector))),
    Ok(Some(elem)) => Ok(elem),
    Err(err) => Err(err),
  }
}

struct Selectors {
  evni: Selector,
  login_error: Selector,
  top_bar: Selector,
  username_in_top_bar: Selector,
  signin_in_top_bar: Selector,
}

const SELECTORS: Lazy<Selectors> = Lazy::new(|| Selectors::init().expect("failed to init Selectors"));

impl Selectors {
  fn init() -> Option<Self> {
    Some(Self {
      evni: Selector::parse("h2.evni").ok()?,
      login_error: Selector::parse("div.errorId").ok()?,
      top_bar: Selector::parse("div.topMainBar").ok()?,
      username_in_top_bar: Selector::parse("div.playerInfo > a:nth-child(1)").ok()?,
      signin_in_top_bar: Selector::parse("form span.enter").ok()?,
    })
  }
}

pub fn is_login_page_error(html: &Html) -> bool {
  html.root_element().select(&SELECTORS.login_error).next().is_some()
}

pub fn scrape_username(server: HammerfestServer, html: &Html) -> Result<Option<ShortHammerfestUser>, ScraperError> {
  let selectors: &Selectors = &SELECTORS;
  let root = html.root_element();

  if selectors.evni.matches(&root) {
    return Err(ScraperError::Evni);
  }

  let top_bar = select_one(&root, &selectors.top_bar)?;
  match select_one_opt(&root, &selectors.username_in_top_bar)? {
    None => {
      select_one(&top_bar, &selectors.signin_in_top_bar)?;
      Ok(None)
    },
    Some(username_link) => {
      let username = HammerfestUsername::try_from_string(username_link.inner_html())
        .map_err(|()| ScraperError::InvalidValue)?;
      let raw_id = username_link.value().attr("href")
        .and_then(|s| s.rsplit("user.html/").next())
        .unwrap_or("<missing href>");

      let id = HammerfestUserId::try_from_string(raw_id.to_owned())
        .map_err(|()| ScraperError::InvalidValue)?;
      Ok(Some(ShortHammerfestUser { server, id, username }))
    }
  }
}
