mod texts;
mod utils;

use std::collections::{HashMap, HashSet};

use etwin_core::core::Instant;
use etwin_core::hammerfest::*;
use once_cell::sync::Lazy;
use scraper::Selector;

use self::texts::ScraperTexts;
use self::utils::*;
use super::errors::ScraperError;

pub type Html = scraper::Html;

struct Selectors {
  simple_link: Selector,
  simple_img: Selector,
  login_error: Selector,
  evni_error: Selector,
  top_bar_in_page: Selector,
  username_in_top_bar: Selector,
  signin_in_top_bar: Selector,
  basic_data_in_profile: Selector,
  words_fame_info_in_profile: Selector,
  words_fame_msg_in_profile: Selector,
  item_icons_in_profile: Selector,
  quests_in_profile: Selector,
  quest_item_in_list: Selector,
  fridge_rows_in_inventory: Selector,
  item_qty_in_fridge_row: Selector,
}

static SELECTORS: Lazy<Selectors> = Lazy::new(|| Selectors::init().expect("failed to init Selectors"));

impl Selectors {
  fn get() -> &'static Selectors {
    &SELECTORS
  }

  fn init() -> Option<Self> {
    Some(Self {
      simple_link: Selector::parse("a").ok()?,
      simple_img: Selector::parse("img").ok()?,
      login_error: Selector::parse("div.errorId").ok()?,
      evni_error: Selector::parse("h2.evni").ok()?,
      top_bar_in_page: Selector::parse("div.topMainBar").ok()?,
      username_in_top_bar: Selector::parse("div.playerInfo > a:nth-child(1)").ok()?,
      signin_in_top_bar: Selector::parse("form span.enter").ok()?,
      basic_data_in_profile: Selector::parse("dl.profile dd").ok()?,
      words_fame_info_in_profile: Selector::parse("div.wordsFameInfo").ok()?,
      words_fame_msg_in_profile: Selector::parse("dd.wordsFameUser").ok()?,
      item_icons_in_profile: Selector::parse("div.profileItems img").ok()?,
      quests_in_profile: Selector::parse("ul.profileQuestsTitle").ok()?,
      quest_item_in_list: Selector::parse("li:not(.nothing)").ok()?,
      fridge_rows_in_inventory: Selector::parse("table.fridge tbody tr").ok()?,
      item_qty_in_fridge_row: Selector::parse("td.quantity").ok()?,
    })
  }
}

pub fn is_login_page_error(html: &Html) -> bool {
  html
    .root_element()
    .select(&Selectors::get().login_error)
    .next()
    .is_some()
}

struct RawTopBar<'a> {
  user_name: &'a str,
  user_id: &'a str,
}

fn scrape_raw_top_bar(html: &Html) -> Result<Option<RawTopBar>, ScraperError> {
  let selectors = Selectors::get();
  let root = html.root_element();

  if root.select(&selectors.evni_error).next().is_some() {
    return Err(ScraperError::Evni);
  }

  let top_bar = select_one(&root, &selectors.top_bar_in_page)?;
  match select_one_opt(&root, &selectors.username_in_top_bar)? {
    None => {
      select_one(&top_bar, &selectors.signin_in_top_bar)?;
      Ok(None)
    }
    Some(user_link) => {
      let user_name = get_inner_text(&user_link)?.trim();
      let user_id = user_link
        .value()
        .attr("href")
        .and_then(|s| s.rsplit("user.html/").next())
        .unwrap_or("<missing href>");
      Ok(Some(RawTopBar { user_id, user_name }))
    }
  }
}

pub fn scrape_user_base(server: HammerfestServer, html: &Html) -> Result<Option<ShortHammerfestUser>, ScraperError> {
  let top_bar = match scrape_raw_top_bar(html)? {
    Some(tp) => tp,
    None => return Ok(None),
  };

  let username = HammerfestUsername::try_from_string(top_bar.user_name.to_owned())
    .map_err(|err| ScraperError::InvalidUsername(top_bar.user_name.to_owned(), err))?;
  let id = top_bar
    .user_id
    .parse()
    .map_err(|err| ScraperError::InvalidUserId(top_bar.user_id.to_owned(), err))?;

  Ok(Some(ShortHammerfestUser { server, id, username }))
}

fn parse_item_small_url(url: &str) -> Option<Result<HammerfestItemId, ScraperError>> {
  const ITEM_URL_PREFIX: &str = "/img/items/small/";
  const ITEM_URL_POSTFIX: &str = ".gif";
  let item = match utils::remove_prefix_and_suffix(url, ITEM_URL_PREFIX, ITEM_URL_POSTFIX) {
    // `a` is the name of the question mark icon used for not-yet-unlocked items.
    Some("a") => return None,
    Some(item) => item,
    None => "<missing-src>",
  };

  Some(
    item
      .parse()
      .map_err(|err| ScraperError::InvalidItemId(item.to_owned(), err)),
  )
}

fn parse_item_url(url: &str) -> Result<HammerfestItemId, ScraperError> {
  const ITEM_URL_PREFIX: &str = "/img/items/";
  const ITEM_URL_POSTFIX: &str = ".gif";
  let item = utils::remove_prefix_and_suffix(url, ITEM_URL_PREFIX, ITEM_URL_POSTFIX).unwrap_or("<missing-src>");

  item
    .parse()
    .map_err(|err| ScraperError::InvalidItemId(item.to_owned(), err))
}

pub fn scrape_user_profile(
  server: HammerfestServer,
  id: HammerfestUserId,
  html: &Html,
) -> Result<Option<HammerfestProfile>, ScraperError> {
  let selectors = Selectors::get();
  let texts = ScraperTexts::get(server);
  let root = html.root_element();

  let is_logged_in = match scrape_raw_top_bar(html) {
    Ok(top_bar) => top_bar.is_some(),
    Err(ScraperError::Evni) => return Ok(None),
    Err(err) => return Err(err),
  };

  let mut email_elem = None;
  let (username_elem, best_score_elem, best_level_elem, season_score_elem, rank_elem) = {
    let mut it = root.select(&selectors.basic_data_in_profile).filter_map(|elem| {
      if let Some(email_link) = elem.select(&selectors.simple_link).next() {
        email_elem = Some(email_link);
        None
      } else {
        Some(elem)
      }
    });

    match (it.next(), it.next(), it.next(), it.next(), it.next(), it.next()) {
      (Some(a), Some(b), Some(c), Some(d), Some(e), None) => (a, b, c, d, e),
      (_, _, _, _, _, None) => {
        return Err(ScraperError::HtmlFragmentNotFound(selector_to_string(
          &selectors.simple_link,
        )))
      }
      (_, _, _, _, _, Some(_)) => {
        return Err(ScraperError::TooManyHtmlFragments(selector_to_string(
          &selectors.simple_link,
        )))
      }
    }
  };

  let username = get_inner_text(&username_elem)?.trim();
  let username = HammerfestUsername::try_from_string(username.to_owned())
    .map_err(|err| ScraperError::InvalidUsername(username.to_owned(), err))?;
  let best_score = parse_dotted_u32(get_inner_text(&best_score_elem)?)?;
  let season_score = parse_dotted_u32(get_inner_text(&season_score_elem)?)?;
  let best_level = {
    let raw_best_level = best_level_elem.text().next().unwrap_or("").trim();
    if raw_best_level.is_empty() {
      0
    } else {
      parse_dotted_u32(raw_best_level)?
    }
  };
  let has_carrot = best_level_elem.children().skip(1).next().is_some();
  let email = match (email_elem, is_logged_in) {
    (None, true) => Some(None),
    (None, false) => None,
    (Some(email), _) => Some(Some(get_inner_text(&email)?.to_owned())),
  };
  let rank = match select_one(&rank_elem, &selectors.simple_img)?.value().attr("class") {
    Some("icon_pyramid icon_pyramid_hof") => 0,
    Some("icon_pyramid icon_pyramid_1") => 1,
    Some("icon_pyramid icon_pyramid_2") => 2,
    Some("icon_pyramid icon_pyramid_3") => 3,
    Some("icon_pyramid icon_pyramid_4") => 4,
    class => return Err(ScraperError::UnknownRankClass(class.unwrap_or("<empty>").to_owned())),
  };

  let hall_of_fame = if rank != 0 {
    None
  } else {
    Some({
      let words_fame_info_elem = select_one(&root, &selectors.words_fame_info_in_profile)?;
      let words_fame_msg_elem = select_one(&root, &selectors.words_fame_msg_in_profile)?;

      let raw_date = get_inner_text(&words_fame_info_elem)?.split(' ').last().unwrap_or("");
      let date = match chrono::NaiveDate::parse_from_str(raw_date, "%Y-%m-%d") {
        Ok(date) => Ok(Instant::from_utc(date.and_hms(0, 0, 0), chrono::Utc)),
        Err(err) => Err(ScraperError::InvalidDate(raw_date.to_owned(), err)),
      }?;
      let message = get_inner_text(&words_fame_msg_elem)?.trim().to_owned();

      HammerfestHallOfFameMessage { date, message }
    })
  };

  let items = root
    .select(&selectors.item_icons_in_profile)
    .filter_map(|item_elem| match item_elem.value().attr("src") {
      Some(src) => parse_item_small_url(src),
      None => Some(Err(ScraperError::HtmlFragmentNotFound(selector_to_string(
        &selectors.item_icons_in_profile,
      )))),
    })
    .collect::<Result<HashSet<_>, _>>()?;

  let quest_elems = {
    let mut it = root.select(&selectors.quests_in_profile);
    match (it.next(), it.next(), it.next()) {
      (Some(quest_complete_elem), Some(quest_pending_elem), None) => {
        let complete = quest_complete_elem
          .select(&selectors.quest_item_in_list)
          .map(|elem| (elem, HammerfestQuestStatus::Complete));
        let pending = quest_pending_elem
          .select(&selectors.quest_item_in_list)
          .map(|elem| (elem, HammerfestQuestStatus::Pending));
        complete.chain(pending)
      }
      (_, _, None) => {
        return Err(ScraperError::HtmlFragmentNotFound(selector_to_string(
          &selectors.quests_in_profile,
        )))
      }
      (_, _, Some(_)) => {
        return Err(ScraperError::TooManyHtmlFragments(selector_to_string(
          &selectors.quests_in_profile,
        )))
      }
    }
  };

  let quests = quest_elems
    .map(|(name, status)| {
      let name = get_inner_text(&name)?.trim();
      match texts.quest_names.get(name) {
        Some(id) => Ok((id.clone(), status)),
        None => Err(ScraperError::UnknownQuestName(name.to_owned())),
      }
    })
    .collect::<Result<HashMap<_, _>, _>>()?;

  Ok(Some(HammerfestProfile {
    user: ShortHammerfestUser { server, id, username },
    email,
    best_level,
    best_score,
    season_score,
    has_carrot,
    rank,
    hall_of_fame,
    items,
    quests,
  }))
}

pub fn scrape_user_inventory(html: &Html) -> Result<Option<HashMap<HammerfestItemId, u32>>, ScraperError> {
  let selectors = Selectors::get();

  if scrape_raw_top_bar(html)?.is_none() {
    return Ok(None);
  }

  html
    .select(&selectors.fridge_rows_in_inventory)
    .map(|row_elem| {
      let item_elem = utils::select_one(&row_elem, &selectors.simple_img)?;
      let qty_elem = utils::select_one(&row_elem, &selectors.item_qty_in_fridge_row)?;

      let item = match item_elem.value().attr("src") {
        Some(src) => parse_item_url(src)?,
        None => {
          return Err(ScraperError::HtmlFragmentNotFound(selector_to_string(
            &selectors.item_icons_in_profile,
          )))
        }
      };

      let qty = utils::get_inner_text(&qty_elem)?;
      let qty = utils::remove_prefix_and_suffix(qty, "x", "").unwrap_or(qty);
      let qty = qty
        .parse()
        .map_err(|err| ScraperError::InvalidInteger(qty.to_owned(), err))?;
      Ok((item, qty))
    })
    .collect::<Result<HashMap<_, _>, _>>()
    .map(Some)
}
