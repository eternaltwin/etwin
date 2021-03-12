mod texts;
mod utils;
use self::texts::ScraperTexts;
use self::utils::Selectors;
use super::errors::ScraperError;
use crate::http::scraper::utils::parse_u32;
use etwin_core::core::Instant;
use etwin_core::email::EmailAddress;
use etwin_core::hammerfest::*;
use etwin_scraper_tools::ElementRefExt;
use scraper::ElementRef;
use std::collections::{HashMap, HashSet};
use std::num::NonZeroU16;
use std::str::FromStr;

pub type Html = scraper::Html;
pub type Result<T> = std::result::Result<T, ScraperError>;

pub fn is_login_page_error(html: &Html) -> bool {
  Selectors::get()
    .select(html.root_element(), "div.errorId")
    .next()
    .is_some()
}

struct RawUserLink<'a> {
  username: &'a str,
  user_id: &'a str,
}

impl<'a> RawUserLink<'a> {
  fn scrape(user_link: ElementRef<'a>) -> Result<RawUserLink<'a>> {
    let username = utils::get_inner_text(user_link)?.trim();
    let user_id = user_link
      .value()
      .attr("href")
      .and_then(|s| s.rsplit("user.html/").next())
      .unwrap_or("<missing href>");
    Ok(Self { username, user_id })
  }

  fn to_user(&self, server: HammerfestServer) -> Result<ShortHammerfestUser> {
    let username = HammerfestUsername::from_str(self.username)
      .map_err(|err| ScraperError::InvalidUsername(self.username.to_owned(), err))?;
    let id = self
      .user_id
      .parse()
      .map_err(|err| ScraperError::InvalidUserId(self.user_id.to_owned(), err))?;
    Ok(ShortHammerfestUser { server, id, username })
  }
}

fn scrape_raw_top_bar(html: &Html) -> Result<Option<(ElementRef<'_>, RawUserLink<'_>)>> {
  let selectors = Selectors::get();
  let root = html.root_element();

  if selectors.select(root, "h2.evni").next().is_some() {
    return Err(ScraperError::Evni);
  }

  let top_bar = selectors.select_one(root, "div.topMainBar")?;
  match selectors.select_one_opt(root, "div.playerInfo > a:nth-child(1)")? {
    None => {
      // Check that the signin button exists.
      selectors.select_one(top_bar, "form span.enter")?;
      Ok(None)
    }
    Some(user_link) => Ok(Some((top_bar, RawUserLink::scrape(user_link)?))),
  }
}

pub fn scrape_user_base(server: HammerfestServer, html: &Html) -> Result<Option<ShortHammerfestUser>> {
  match scrape_raw_top_bar(html)? {
    Some((_, user_link)) => Ok(Some(user_link.to_user(server)?)),
    None => Ok(None),
  }
}

fn parse_item_small_url(url: &str) -> Result<Option<HammerfestItemId>> {
  let item = url
    .strip_prefix("/img/items/small/")
    .and_then(|s| s.strip_suffix(".gif"))
    .unwrap_or(url);

  if item == "a" {
    // `a` is the name of the question mark icon used for not-yet-unlocked items.
    return Ok(None);
  }

  match item.parse() {
    Ok(item) => Ok(Some(item)),
    Err(err) => Err(ScraperError::InvalidItemId(item.to_owned(), err)),
  }
}

fn parse_item_url(url: &str) -> Result<HammerfestItemId> {
  let item = url
    .strip_prefix("/img/items/")
    .and_then(|s| s.strip_suffix(".gif"))
    .unwrap_or(url);

  item
    .parse()
    .map_err(|err| ScraperError::InvalidItemId(item.to_owned(), err))
}

fn parse_user_ladder_level(img_class: &str) -> Result<HammerfestLadderLevel> {
  let inner = match img_class {
    "icon_pyramid icon_pyramid_hof" => 0,
    "icon_pyramid icon_pyramid_1" => 1,
    "icon_pyramid icon_pyramid_2" => 2,
    "icon_pyramid icon_pyramid_3" => 3,
    "icon_pyramid icon_pyramid_4" => 4,
    class => return Err(ScraperError::UnknownLadderLevelClass(class.to_owned())),
  };
  Ok(HammerfestLadderLevel::new(inner).unwrap())
}

fn parse_theme_title(title: &str) -> Result<HammerfestForumThemeTitle> {
  HammerfestForumThemeTitle::from_str(title).map_err(|err| ScraperError::InvalidForumThemeTitle(title.to_owned(), err))
}

fn parse_theme_description(title: &str) -> Result<HammerfestForumThemeDescription> {
  HammerfestForumThemeDescription::from_str(title)
    .map_err(|err| ScraperError::InvalidForumThemeDescription(title.to_owned(), err))
}

fn parse_thread_title(title: &str) -> Result<HammerfestForumThreadTitle> {
  HammerfestForumThreadTitle::from_str(title)
    .map_err(|err| ScraperError::InvalidForumThreadTitle(title.to_owned(), err))
}

pub fn scrape_user_profile(
  server: HammerfestServer,
  id: HammerfestUserId,
  html: &Html,
) -> Result<Option<HammerfestProfile>> {
  let selectors = Selectors::get();
  let texts = ScraperTexts::get(server);
  let root = html.root_element();

  let is_logged_in = match scrape_raw_top_bar(html) {
    Ok(top_bar) => top_bar.is_some(),
    Err(ScraperError::Evni) => return Ok(None),
    Err(err) => return Err(err),
  };

  let mut email_elem = None;
  let [username_elem, best_score_elem, best_level_elem, season_score_elem, rank_elem] = selectors
    .select_five_and_filter(root, "dl.profile dd", |elem| {
      if let Some(email_link) = selectors.select(elem, "a").next() {
        email_elem = Some(email_link);
        false
      } else {
        true
      }
    })?;

  let username = utils::get_inner_text(username_elem)?.trim();
  let username =
    HammerfestUsername::from_str(username).map_err(|err| ScraperError::InvalidUsername(username.to_owned(), err))?;
  let best_score = utils::parse_dotted_u32(utils::get_inner_text(best_score_elem)?)?;
  let season_score = utils::parse_dotted_u32(utils::get_inner_text(season_score_elem)?)?;
  let best_level = {
    let raw_best_level = best_level_elem.text().next().unwrap_or("").trim();
    if raw_best_level.is_empty() {
      0
    } else {
      utils::parse_u8(raw_best_level)?
    }
  };
  let has_carrot = best_level_elem.children().nth(1).is_some();
  let email = match (email_elem, is_logged_in) {
    (None, true) => Some(None),
    (None, false) => None,
    (Some(email), _) => Some(Some({
      let raw_email = utils::get_inner_text(email)?;
      EmailAddress::from_str(raw_email).map_err(|err| ScraperError::InvalidEmail(raw_email.to_owned(), err))?
    })),
  };
  let ladder_level = parse_user_ladder_level(selectors.select_one_attr(rank_elem, "img", "class")?)?;

  let hall_of_fame = if ladder_level.get() == 0 {
    Some({
      let words_fame_info_elem = selectors.select_one(root, "div.wordsFameInfo")?;
      let words_fame_msg_elem = selectors.select_one(root, "dd.wordsFameUser")?;

      let raw_date = utils::get_inner_text(words_fame_info_elem)?
        .split(' ')
        .last()
        .unwrap_or("");
      let date = match chrono::NaiveDate::parse_from_str(raw_date, "%Y-%m-%d") {
        Ok(date) => Ok(Instant::from_utc(date.and_hms(0, 0, 0), chrono::Utc)),
        Err(err) => Err(ScraperError::InvalidDate(raw_date.to_owned(), Some(err))),
      }?;
      let message = utils::get_inner_text(words_fame_msg_elem)?.trim().to_owned();

      HammerfestHallOfFameMessage { date, message }
    })
  } else {
    None
  };

  let items = selectors
    .select_attrs(root, "div.profileItems img", "src")
    .map(|url| parse_item_small_url(url?))
    .filter_map(|e| e.transpose())
    .collect::<Result<HashSet<_>>>()?;

  let quest_elems = {
    let [quest_complete_elem, quest_pending_elem] = selectors.select_two(root, "ul.profileQuestsTitle")?;
    let complete = selectors
      .select(quest_complete_elem, "li:not(.nothing)")
      .map(|elem| (elem, HammerfestQuestStatus::Complete));
    let pending = selectors
      .select(quest_pending_elem, "li:not(.nothing)")
      .map(|elem| (elem, HammerfestQuestStatus::Pending));
    complete.chain(pending)
  };

  let quests = quest_elems
    .map(|(name, status)| {
      let name = utils::get_inner_text(name)?.trim();
      match texts.quest_names.get(name) {
        Some(id) => Ok((*id, status)),
        None => Err(ScraperError::UnknownQuestName(name.to_owned())),
      }
    })
    .collect::<Result<HashMap<_, _>>>()?;

  Ok(Some(HammerfestProfile {
    user: ShortHammerfestUser { server, id, username },
    email,
    best_level,
    best_score,
    season_score,
    has_carrot,
    ladder_level,
    hall_of_fame,
    items,
    quests,
  }))
}

pub fn scrape_user_inventory(html: &Html) -> Result<Option<HashMap<HammerfestItemId, u32>>> {
  let selectors = Selectors::get();

  if scrape_raw_top_bar(html)?.is_none() {
    return Ok(None);
  }

  selectors
    .select(html.root_element(), "table.fridge tbody tr")
    .map(|row_elem| {
      let item_url = selectors.select_one_attr(row_elem, "img", "src")?;
      let qty_elem = selectors.select_one(row_elem, "td.quantity")?;

      let item = parse_item_url(item_url)?;
      let qty = utils::get_inner_text(qty_elem)?;
      let qty = utils::parse_u32(qty.strip_prefix("x").unwrap_or(qty))?;
      Ok((item, qty))
    })
    .collect::<Result<HashMap<_, _>>>()
    .map(Some)
}

fn parse_weekly_tokens_number(text: &str) -> Result<u8> {
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

  utils::parse_u8(num)
}

fn parse_purchased_tokens_number(text: &str) -> Result<u8> {
  // The number of purchased tokens is to the left of the separator.
  // e.g.:  Parties achetées: 153 | Prochain palier: 250 parties
  let num = match text.find(" |") {
    Some(sep) => text[..sep].rsplit(' ').next().expect("expected non-empty text"),
    None => text, // No separator, so use the full text (this will probably force an error when parsing).
  };

  utils::parse_u8(num)
}

pub fn scrape_user_shop(html: &Html) -> Result<Option<HammerfestShop>> {
  let selectors = Selectors::get();
  let root = html.root_element();

  let top_bar_elem = match scrape_raw_top_bar(html)? {
    Some((top_bar, _)) => top_bar,
    None => return Ok(None),
  };

  let tokens_elem = selectors.select_one(top_bar_elem, "div.playerInfo > a:nth-child(3)")?;
  let tokens = utils::get_inner_text(tokens_elem)?;
  let tokens = utils::parse_u32(tokens)?;

  let shop_status_elem = selectors.select_one(root, "div.freeDays")?;

  let weekly_tokens_elem = selectors.select_one_opt(shop_status_elem, "div.weeklyStatus")?;
  let weekly_tokens = match weekly_tokens_elem {
    Some(elem) => utils::get_inner_text(elem).and_then(parse_weekly_tokens_number)?,
    None => 0,
  };

  let purchased_tokens_elem = selectors.select_one_opt(shop_status_elem, "div.stepLabel")?;
  let purchased_tokens = match purchased_tokens_elem {
    Some(elem) => Some(utils::get_inner_text(elem).and_then(parse_purchased_tokens_number)?),
    // Couldn't find the number of purchased tokens. This can means two things:
    // - The user never bought any tokens.
    // - The user bought enough tokens to complete all reward steps.
    // We distinguish the two cases by looking at the number of weekly tokens.
    None => Some(0).filter(|_| weekly_tokens == 0),
  };

  let has_quest_bonus = selectors.select_one_opt(root, "div.bankBonus > div.pic")?.is_some();

  Ok(Some(HammerfestShop {
    tokens,
    weekly_tokens,
    purchased_tokens,
    has_quest_bonus,
  }))
}

pub fn scrape_user_god_children(server: HammerfestServer, html: &Html) -> Result<Option<Vec<HammerfestGodchild>>> {
  let selectors = Selectors::get();

  if scrape_raw_top_bar(html)?.is_none() {
    return Ok(None);
  }

  selectors
    .select(html.root_element(), "table.sponsor tbody tr")
    .map(|row| {
      let user_elem = selectors.select_one(row, "a")?;
      let user = RawUserLink::scrape(user_elem)?.to_user(server)?;

      let tokens_elem = selectors.select_one(row, "td:nth-child(2)")?;
      let tokens = utils::get_inner_text(tokens_elem)?.trim();
      let tokens = tokens.parse().unwrap_or(0);

      Ok(HammerfestGodchild { user, tokens })
    })
    .collect::<Result<Vec<_>>>()
    .map(Some)
}

fn parse_generic_id_url<T: FromStr>(
  url: &str,
  prefix: &str,
  err_mapper: impl FnOnce(String, T::Err) -> ScraperError,
) -> Result<T> {
  let raw_id = match url.strip_prefix(prefix) {
    Some(rest) => rest.split('/').next().expect("non-empty iterator"),
    None => url,
  };

  raw_id.parse().map_err(|err| err_mapper(raw_id.to_owned(), err))
}

fn parse_forum_theme_id_url(url: &str) -> Result<HammerfestForumThemeId> {
  parse_generic_id_url(url, "/forum.html/theme/", ScraperError::InvalidForumThemeId)
}

fn parse_forum_thread_id_url(url: &str) -> Result<HammerfestForumThreadId> {
  parse_generic_id_url(url, "/forum.html/thread/", ScraperError::InvalidForumThreadId)
}

fn parse_forum_post_id_url(url: &str) -> Result<HammerfestForumMessageId> {
  parse_generic_id_url(url, "/forum.html/message/", ScraperError::InvalidForumMessageId)
}

pub fn scrape_forum_home(server: HammerfestServer, html: &Html) -> Result<Vec<HammerfestForumTheme>> {
  let selectors = Selectors::get();

  // Check session validity.
  scrape_raw_top_bar(html)?;

  selectors
    .select(html.root_element(), "div.forumCat dl")
    .map(|theme_elem| {
      let theme_desc_elem = selectors.select_one(theme_elem, "dd.categDesc")?;
      let theme_url = selectors.select_one_attr(theme_elem, "dt.categ a", "href")?;
      if theme_url.starts_with("http://support.motion-twin.com") {
        // This is the FAQ link, ignore it.
        return Ok(None);
      }
      let id = parse_forum_theme_id_url(theme_url)?;

      let name = selectors
        .select_one(theme_elem, "dt.categ a")
        .and_then(utils::get_inner_text)?
        .trim();
      let name = parse_theme_title(name)?;
      let description = utils::get_inner_text(theme_desc_elem)?.trim();
      let description = parse_theme_description(description)?;
      Ok(Some(HammerfestForumTheme {
        short: ShortHammerfestForumTheme { id, name, server },
        description,
      }))
    })
    .filter_map(|e| e.transpose())
    .collect()
}

fn parse_forum_date(texts: &ScraperTexts, date: &str) -> Result<HammerfestDate> {
  let mut it = date.split_whitespace();
  if let (Some(wd), Some(d), Some(m), None) = (it.next(), it.next(), it.next(), it.next()) {
    if let (Some(weekday), Ok(day), Some(month)) = (
      texts.weekday_names.get(wd).copied(),
      d.parse(),
      texts.month_names.get(m).copied(),
    ) {
      return Ok(HammerfestDate { weekday, day, month });
    }
  }

  Err(ScraperError::InvalidDate(date.to_owned(), None))
}

fn parse_forum_page_numbers(text: &str) -> Result<(NonZeroU16, NonZeroU16)> {
  let mut it = text.split_whitespace().skip(1).flat_map(|s| s.split('/'));
  match (it.next(), it.next()) {
    (Some(a), Some(b)) => Ok((utils::parse_non_zero_u16(a)?, utils::parse_non_zero_u16(b)?)),
    _ => Err(ScraperError::InvalidPagination),
  }
}

pub fn scrape_forum_theme(server: HammerfestServer, html: &Html) -> Result<HammerfestForumThemePage> {
  let selectors = Selectors::get();
  let texts = ScraperTexts::get(server);

  // Check session validity.
  scrape_raw_top_bar(html)?;

  let forum_elem = selectors.select_one(html.root_element(), "div.forum")?;
  let paginate_elem = selectors.select_one(forum_elem, "div.paginateBox")?;

  let theme = {
    let raw_name = selectors.select_text_following(forum_elem, "h1 a")?;
    let name = raw_name.strip_prefix(" > ").unwrap_or(raw_name).trim();
    let name = parse_theme_title(name)?;

    let id_link = selectors.select_one_attr(paginate_elem, "div.paginate a:first-of-type", "href")?;
    let id = parse_forum_theme_id_url(id_link)?;
    ShortHammerfestForumTheme { server, id, name }
  };

  let (page1, pages) = {
    let raw = utils::get_inner_text(selectors.select_one(paginate_elem, "div.currentPage")?)?.trim();
    parse_forum_page_numbers(raw)?
  };

  // We can't use Iterator::partition, because it doesn't support `Result`s.
  let (mut sticky, mut items) = (Vec::new(), Vec::new());
  let mut current_date = None;
  for thread_elem in selectors.select(forum_elem, "table.threads tr").skip(1) {
    if let Some(date_elem) = selectors.select_one_opt(thread_elem, "td.forumDate")? {
      current_date = Some(parse_forum_date(texts, utils::get_inner_text(date_elem)?)?);
      continue;
    }

    let classes = thread_elem.value().attr("class").unwrap_or_default();
    let is_sticky = classes.contains("sticky");
    let is_closed = classes.contains("closed");
    let author_is_moderator = classes.contains("mode");
    let author_is_admin = classes.contains("admin");
    let author_role = if author_is_admin {
      HammerfestForumRole::Administrator
    } else if author_is_moderator {
      HammerfestForumRole::Moderator
    } else {
      HammerfestForumRole::None
    };

    if is_sticky != current_date.is_none() {
      let classes = classes.split_whitespace().collect::<Vec<_>>();
      return Err(ScraperError::UnexpectedThreadKind(classes.join(" ")));
    }

    let subject_elem = selectors.select_one(thread_elem, "td.subject > a")?;
    let author_elem = selectors.select_one(thread_elem, "td.author > a")?;
    let replies_elem = selectors.select_one(thread_elem, "td.replies")?;

    let id = parse_forum_thread_id_url(subject_elem.value().attr("href").unwrap_or("<missing-href>"))?;

    let name = utils::get_inner_text(subject_elem)?;
    let name = parse_thread_title(name)?;
    let author = RawUserLink::scrape(author_elem)?.to_user(server)?;
    let reply_count = utils::parse_u16(utils::get_inner_text(replies_elem)?.trim())?;

    let thread = HammerfestForumThread {
      short: ShortHammerfestForumThread {
        server,
        id,
        name,
        is_closed,
      },
      kind: match &current_date {
        Some(date) => HammerfestForumThreadKind::Regular {
          last_message_date: *date,
        },
        None => HammerfestForumThreadKind::Sticky,
      },
      author,
      author_role,
      reply_count,
    };

    if is_sticky {
      sticky.push(thread);
    } else {
      items.push(thread);
    }
  }

  Ok(HammerfestForumThemePage {
    theme,
    sticky,
    threads: HammerfestForumThreadListing { page1, pages, items },
  })
}

fn parse_forum_date_time(texts: &ScraperTexts, date_time: &str) -> Result<HammerfestDateTime> {
  let mut it = date_time.rsplitn(2, ' ');
  if let (Some(time), Some(date)) = (it.next(), it.next()) {
    let date = parse_forum_date(texts, date)?;
    let mut it = time.splitn(2, ':');
    if let (Some(h), Some(m)) = (it.next(), it.next()) {
      if let (Ok(hour), Ok(minute)) = (h.parse(), m.parse()) {
        return Ok(HammerfestDateTime { date, hour, minute });
      }
    }
  }

  Err(ScraperError::InvalidDate(date_time.to_owned(), None))
}

pub fn scrape_forum_thread(
  server: HammerfestServer,
  id: HammerfestForumThreadId,
  html: &Html,
) -> Result<HammerfestForumThreadPage> {
  let selectors = Selectors::get();
  let texts = ScraperTexts::get(server);

  // Check session validity.
  scrape_raw_top_bar(html)?;

  let forum_elem = selectors.select_one(html.root_element(), "div.forum")?;

  let theme = {
    let theme_link = selectors.select_one(forum_elem, "h1 a:nth-of-type(2)")?;
    let name = utils::get_inner_text(theme_link)?;
    let name = parse_theme_title(name)?;
    let id = parse_forum_theme_id_url(theme_link.value().attr("href").unwrap_or("<missing-href>"))?;
    ShortHammerfestForumTheme { server, id, name }
  };

  let thread = {
    let name = utils::get_inner_text(selectors.select_one(forum_elem, "h2.view span")?)?;
    let name = parse_thread_title(name)?;
    let is_closed: bool = selectors
      .select(forum_elem, ":scope > ul.menuf > li.isClosed")
      .next()
      .is_some();
    ShortHammerfestForumThread {
      server,
      id,
      name,
      is_closed,
    }
  };

  let (page1, pages) = match selectors.select_one_opt(forum_elem, "div.paginateBox div.currentPage")? {
    Some(elem) => parse_forum_page_numbers(utils::get_inner_text(elem)?.trim())?,
    None => (NonZeroU16::new(1).unwrap(), NonZeroU16::new(1).unwrap()),
  };

  let items = selectors
    .select(forum_elem, "div.message")
    .map(|msg_elem| {
      let id = match selectors.select_attrs(forum_elem, "ul.power a", "href").next() {
        Some(url) => Some(parse_forum_post_id_url(url?)?),
        None => None,
      };
      let content = selectors.select_one(msg_elem, "div.content")?.inner_html();

      let header_elem = selectors.select_one(msg_elem, "div.header")?;
      let raw_ctime = utils::get_inner_text(selectors.select_one(header_elem, "div.date")?)?.trim();
      let ctime = parse_forum_date_time(texts, raw_ctime)?;

      let author_elem = selectors.select_one(header_elem, "div.author")?;
      let user_link = selectors.select_one(author_elem, "a")?;
      let star_count = selectors.select_attrs(author_elem, "span.rank img", "src").count();

      let rank = selectors.select_one(header_elem, ":scope > .statut > span")?;
      let rank = rank
        .get_one_text()
        .map_err(|_e| ScraperError::HtmlFragmentNotFound(":scope > .statut > span::text".to_owned()))?;
      let rank = parse_u32(rank).ok();

      Ok(HammerfestForumMessage {
        id,
        content,
        ctime,
        author: HammerfestForumMessageAuthor {
          user: RawUserLink::scrape(user_link)?.to_user(server)?,
          has_carrot: selectors.select_one_opt(author_elem, "span:not(.rank) img")?.is_some(),
          ladder_level: parse_user_ladder_level(selectors.select_one_attr(header_elem, "div.statut img", "class")?)?,
          rank,
          role: match star_count {
            0 => HammerfestForumRole::None,
            1 => HammerfestForumRole::Moderator,
            3 => HammerfestForumRole::Administrator,
            _ => return Err(ScraperError::UnknownUserRole),
          },
        },
      })
    })
    .collect::<Result<Vec<_>>>()?;

  Ok(HammerfestForumThreadPage {
    theme,
    thread,
    messages: HammerfestForumPostListing { page1, pages, items },
  })
}
