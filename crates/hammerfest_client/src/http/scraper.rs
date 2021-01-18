mod texts;
mod utils;

use std::collections::{HashMap, HashSet};

use etwin_core::core::Instant;
use etwin_core::hammerfest::*;
use once_cell::sync::Lazy;
use scraper::{ElementRef, Selector};

use self::texts::ScraperTexts;
use self::utils::*;
use super::errors::ScraperError;
use std::str::FromStr;

pub type Html = scraper::Html;

struct Selectors {
  simple_link: Selector,
  simple_img: Selector,
  login_error: Selector,
  evni_error: Selector,
  top_bar_in_page: Selector,
  username_in_top_bar: Selector,
  signin_in_top_bar: Selector,
  token_count_in_top_bar: Selector,
  basic_data_in_profile: Selector,
  words_fame_info_in_profile: Selector,
  words_fame_msg_in_profile: Selector,
  item_icons_in_profile: Selector,
  quests_in_profile: Selector,
  quest_item_in_list: Selector,
  fridge_rows_in_inventory: Selector,
  item_qty_in_fridge_row: Selector,
  quest_bonus_in_shop: Selector,
  shop_status_in_shop: Selector,
  weekly_tokens_in_shop_status: Selector,
  step_label_in_shop_status: Selector,
  rows_in_god_children: Selector,
  token_amount_in_god_child_row: Selector,
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
      token_count_in_top_bar: Selector::parse("div.playerInfo > a:nth-child(3)").ok()?,
      basic_data_in_profile: Selector::parse("dl.profile dd").ok()?,
      words_fame_info_in_profile: Selector::parse("div.wordsFameInfo").ok()?,
      words_fame_msg_in_profile: Selector::parse("dd.wordsFameUser").ok()?,
      item_icons_in_profile: Selector::parse("div.profileItems img").ok()?,
      quests_in_profile: Selector::parse("ul.profileQuestsTitle").ok()?,
      quest_item_in_list: Selector::parse("li:not(.nothing)").ok()?,
      fridge_rows_in_inventory: Selector::parse("table.fridge tbody tr").ok()?,
      item_qty_in_fridge_row: Selector::parse("td.quantity").ok()?,
      quest_bonus_in_shop: Selector::parse("div.bankBonus > div.pic").ok()?,
      shop_status_in_shop: Selector::parse("div.freeDays").ok()?,
      weekly_tokens_in_shop_status: Selector::parse("div.weeklyStatus").ok()?,
      step_label_in_shop_status: Selector::parse("div.stepLabel").ok()?,
      rows_in_god_children: Selector::parse("table.sponsor tbody tr").ok()?,
      token_amount_in_god_child_row: Selector::parse("td:nth-child(2)").ok()?,
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

struct RawUserLink<'a> {
  user_name: &'a str,
  user_id: &'a str,
}

impl<'a> RawUserLink<'a> {
  fn scrape(user_link: ElementRef<'a>) -> Result<RawUserLink<'a>, ScraperError> {
    let user_name = get_inner_text(user_link)?.trim();
    let user_id = user_link
      .value()
      .attr("href")
      .and_then(|s| s.rsplit("user.html/").next())
      .unwrap_or("<missing href>");
    Ok(Self { user_name, user_id })
  }

  fn into_user(self, server: HammerfestServer) -> Result<ShortHammerfestUser, ScraperError> {
    let username = HammerfestUsername::from_str(self.user_name)
      .map_err(|err| ScraperError::InvalidUsername(self.user_name.to_owned(), err))?;
    let id = self
      .user_id
      .parse()
      .map_err(|err| ScraperError::InvalidUserId(self.user_id.to_owned(), err))?;
    Ok(ShortHammerfestUser { server, id, username })
  }
}

fn scrape_raw_top_bar(html: &Html) -> Result<Option<(ElementRef<'_>, RawUserLink<'_>)>, ScraperError> {
  let selectors = Selectors::get();
  let root = html.root_element();

  if root.select(&selectors.evni_error).next().is_some() {
    return Err(ScraperError::Evni);
  }

  let top_bar = select_one(root, &selectors.top_bar_in_page)?;
  match select_one_opt(root, &selectors.username_in_top_bar)? {
    None => {
      select_one(top_bar, &selectors.signin_in_top_bar)?;
      Ok(None)
    }
    Some(user_link) => Ok(Some((top_bar, RawUserLink::scrape(user_link)?))),
  }
}

pub fn scrape_user_base(server: HammerfestServer, html: &Html) -> Result<Option<ShortHammerfestUser>, ScraperError> {
  match scrape_raw_top_bar(html)? {
    Some((_, user_link)) => Ok(Some(user_link.into_user(server)?)),
    None => Ok(None),
  }
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
    // TODO: Remove this clippy exception
    #[allow(clippy::unnecessary_filter_map)]
    let mut it = root.select(&selectors.basic_data_in_profile).filter_map(|elem| {
      if let Some(email_link) = elem.select(&selectors.simple_link).next() {
        email_elem = Some(email_link);
        None
      } else {
        Some(elem)
      }
    });

    match (it.next(), it.next(), it.next(), it.next(), it.next(), it.next()) {
      (
        Some(username_elem),
        Some(best_score_elem),
        Some(best_level_elem),
        Some(season_score_elem),
        Some(rank_elem),
        None,
      ) => (
        username_elem,
        best_score_elem,
        best_level_elem,
        season_score_elem,
        rank_elem,
      ),
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

  let username = get_inner_text(username_elem)?.trim();
  let username =
    HammerfestUsername::from_str(username).map_err(|err| ScraperError::InvalidUsername(username.to_owned(), err))?;
  let best_score = parse_dotted_u32(get_inner_text(best_score_elem)?)?;
  let season_score = parse_dotted_u32(get_inner_text(season_score_elem)?)?;
  let best_level = {
    let raw_best_level = best_level_elem.text().next().unwrap_or("").trim();
    if raw_best_level.is_empty() {
      0
    } else {
      parse_dotted_u32(raw_best_level)?
    }
  };
  let has_carrot = best_level_elem.children().nth(1).is_some();
  let email = match (email_elem, is_logged_in) {
    (None, true) => Some(None),
    (None, false) => None,
    (Some(email), _) => Some(Some(get_inner_text(email)?.to_owned())),
  };
  let rank = match select_one(rank_elem, &selectors.simple_img)?.value().attr("class") {
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
      let words_fame_info_elem = select_one(root, &selectors.words_fame_info_in_profile)?;
      let words_fame_msg_elem = select_one(root, &selectors.words_fame_msg_in_profile)?;

      let raw_date = get_inner_text(words_fame_info_elem)?.split(' ').last().unwrap_or("");
      let date = match chrono::NaiveDate::parse_from_str(raw_date, "%Y-%m-%d") {
        Ok(date) => Ok(Instant::from_utc(date.and_hms(0, 0, 0), chrono::Utc)),
        Err(err) => Err(ScraperError::InvalidDate(raw_date.to_owned(), err)),
      }?;
      let message = get_inner_text(words_fame_msg_elem)?.trim().to_owned();

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
      let name = get_inner_text(name)?.trim();
      match texts.quest_names.get(name) {
        Some(id) => Ok((*id, status)),
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
      let item_elem = utils::select_one(row_elem, &selectors.simple_img)?;
      let qty_elem = utils::select_one(row_elem, &selectors.item_qty_in_fridge_row)?;

      let item = match item_elem.value().attr("src") {
        Some(src) => parse_item_url(src)?,
        None => {
          return Err(ScraperError::HtmlFragmentNotFound(selector_to_string(
            &selectors.item_icons_in_profile,
          )))
        }
      };

      let qty = utils::get_inner_text(qty_elem)?;
      let qty = utils::remove_prefix_and_suffix(qty, "x", "").unwrap_or(qty);
      let qty = utils::parse_u32(qty)?;
      Ok((item, qty))
    })
    .collect::<Result<HashMap<_, _>, _>>()
    .map(Some)
}

fn parse_weekly_tokens_number(text: &str) -> Result<u32, ScraperError> {
  let text = text.trim();
  if text.is_empty() {
    return Ok(0);
  }

  // Extract the number of tokens from the text.
  let num = match text.find(|c: char| c.is_ascii_digit()) {
    Some(num_start) => text[num_start..]
      .split(|c: char| c.is_ascii_whitespace())
      .next()
      .expect("expected non-empty number"),
    None => text, // No digits, so this will force an error when parsing.
  };

  utils::parse_u32(num)
}

fn parse_purchased_tokens_number(text: &str) -> Result<u32, ScraperError> {
  // The number of purchased tokens is to the left of the separator.
  // e.g.:  Parties achetées: 153 | Prochain palier: 250 parties
  let num = match text.find(" |") {
    Some(sep) => text[..sep].rsplit(' ').next().expect("expected non-empty text"),
    None => text, // No separator, so use the full text (this will probably force an error when parsing).
  };

  utils::parse_u32(num)
}

pub fn scrape_user_shop(html: &Html) -> Result<Option<HammerfestShop>, ScraperError> {
  let selectors = Selectors::get();
  let root = html.root_element();

  let top_bar_elem = match scrape_raw_top_bar(html)? {
    Some((top_bar, _)) => top_bar,
    None => return Ok(None),
  };

  let tokens_elem = utils::select_one(top_bar_elem, &selectors.token_count_in_top_bar)?;
  let tokens = utils::get_inner_text(tokens_elem)?;
  let tokens = utils::parse_u32(tokens)?;

  let shop_status_elem = utils::select_one(root, &selectors.shop_status_in_shop)?;

  let weekly_tokens_elem = utils::select_one_opt(shop_status_elem, &selectors.weekly_tokens_in_shop_status)?;
  let weekly_tokens = match weekly_tokens_elem {
    Some(elem) => utils::get_inner_text(elem).and_then(parse_weekly_tokens_number)?,
    None => 0,
  };

  let purchased_tokens_elem = utils::select_one_opt(shop_status_elem, &selectors.step_label_in_shop_status)?;
  let purchased_tokens = match purchased_tokens_elem {
    Some(elem) => Some(utils::get_inner_text(elem).and_then(parse_purchased_tokens_number)?),
    // Couldn't find the number of purchased tokens. This can means two things:
    // - The user never bought any tokens.
    // - The user bought enough tokens to complete all reward steps.
    // We distinguish the two cases by looking at the number of weekly tokens.
    None => Some(0).filter(|_| weekly_tokens == 0),
  };

  let has_quest_bonus = utils::select_one_opt(root, &selectors.quest_bonus_in_shop)?.is_some();

  Ok(Some(HammerfestShop {
    tokens,
    weekly_tokens,
    purchased_tokens,
    has_quest_bonus,
  }))
}

pub fn scrape_user_god_children(
  server: HammerfestServer,
  html: &Html,
) -> Result<Option<Vec<HammerfestGodChild>>, ScraperError> {
  let selectors = Selectors::get();

  if scrape_raw_top_bar(html)?.is_none() {
    return Ok(None);
  }

  html
    .select(&selectors.rows_in_god_children)
    .map(|row| {
      let user_elem = utils::select_one(row, &selectors.simple_link)?;
      let user = RawUserLink::scrape(user_elem)?.into_user(server)?;

      let tokens_elem = utils::select_one(row, &selectors.token_amount_in_god_child_row)?;
      let tokens = utils::get_inner_text(tokens_elem)?.trim();
      let tokens = tokens.parse().unwrap_or(0);

      Ok(HammerfestGodChild { user, tokens })
    })
    .collect::<Result<Vec<_>, _>>()
    .map(Some)
}
