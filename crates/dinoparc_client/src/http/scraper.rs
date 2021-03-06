use crate::http::errors::ScraperError;
use crate::http::locale::ScraperLocale;
use crate::http::url::{DinoparcRequest, DinoparcUrls};
use etwin_core::core::IntPercentage;
use etwin_core::dinoparc::{
  DinoparcCollection, DinoparcCollectionResponse, DinoparcDinoz, DinoparcDinozElements, DinoparcDinozId,
  DinoparcDinozName, DinoparcDinozRace, DinoparcDinozResponse, DinoparcEpicRewardKey, DinoparcExchangeWithResponse,
  DinoparcInventoryResponse, DinoparcItemId, DinoparcRewardId, DinoparcServer, DinoparcSessionUser, DinoparcSkill,
  DinoparcSkillLevel, DinoparcUserId, DinoparcUsername, NamedDinoparcDinozFields, ShortDinoparcDinozWithLevel,
  ShortDinoparcDinozWithLocation, ShortDinoparcUser,
};
use etwin_scraper_tools::{ElementRefExt, FlashVars};
use itertools::Itertools;
use once_cell::sync::Lazy;
use percent_encoding::percent_decode_str;
use regex::Regex;
use scraper::{ElementRef, Html, Selector};
#[cfg(test)]
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::convert::{TryFrom, TryInto};
use std::str::FromStr;

/// Regular expression for the one-argument cashFrame.launch call.
/// Matches `cashFrame.launch("...")`
static CASH_FRAME_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"cashFrame\.launch\(("(?:[^"\\]|\\.)*")\)"#).unwrap());

/// Regular expression to extract the integer part of a percentage
/// The percent sign is required.
static PERCENTAGE_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"(\d{1,2}|100)(?:[.,]\d+)?\s?%"#).unwrap());

/// Regular expression to extract the skill level from an image src
/// Example: `"img/lvl2.gif"` -> `2`
static SKILL_LEVEL_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"lvl([0-5])\."#).unwrap());

/// Regular expression to extract the epic reward key from the image src
/// Example: `"img/reward/war32a.gif"` -> `war32a`
static EPIC_REWARD_RE: Lazy<Regex> =
  Lazy::new(|| Regex::new(r#"^img/rewards/([^./]+)\.(?:jpeg|jpg|gif|png)$"#).unwrap());

/// Regular expression to extract match decimal integer
static DECIMAL_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"0|[1-9]\d*"#).unwrap());

/// Regular expression to extract data from a dinoz exhange list
static EXCHANGE_DINOZ_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"^(.+) \(niv ([1-9]\d*)\)$"#).unwrap());

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
      let cash_frame_options = parse_cash_frame_arg(raw_cash_frame_arg);
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
    if let Some((key, value)) = pair.split_once("=") {
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
    DinoparcUsername::from_str(username).map_err(|e| ScraperError::InvalidUsername(username.to_string(), e))?;

  Ok(SelfScraping { username })
}

pub(crate) fn scrape_inventory(doc: &Html) -> Result<DinoparcInventoryResponse<DinoparcUsername>, ScraperError> {
  let root = doc.root_element();

  let context = scrape_context(root)?;
  let session_user = scrape_session_user(context.server, root)?;

  let inventory_table = root
    .select(&Selector::parse(".siteContent .contentPane .inventory table").unwrap())
    .exactly_one()
    .map_err(|_| ScraperError::NonUniqueInventory)?;

  let inventory: Result<HashMap<DinoparcItemId, u32>, ScraperError> = inventory_table
    .select(&Selector::parse(":scope tr").unwrap())
    .skip(1) // Table header
    .map(|row| -> Result<(DinoparcItemId, u32), ScraperError> {
      let help_link = row
        .select(&Selector::parse(":scope > td:nth-child(2) a.helpLink").unwrap())
        .exactly_one()
        .map_err(|_| ScraperError::NonUniqueItemHelpLink)?;

      let help_link = help_link.value().attr("href").ok_or(ScraperError::MissingLinkHref)?;
      let help_link = DinoparcUrls::new(context.server)
        .parse_from_root(help_link)
        .map_err(|_| ScraperError::InvalidLinkHref(help_link.to_string()))?;
      let req = help_link
        .query_pairs()
        .filter_map(|(k, v)| if k.as_ref() == "r" { Some(v) } else { None })
        .exactly_one()
        .map_err(|_| ScraperError::NonUniqueDinoparcRequest)?;
      let req = DinoparcRequest::new(req.as_ref());
      let id = req
        .pairs()
        .filter_map(|(k, v)| if k == "it" { Some(v) } else { None })
        .exactly_one()
        .map_err(|_| ScraperError::NonUniqueItemIdInLink)?;
      let id = DinoparcItemId::from_str(id).map_err(|_| ScraperError::InvalidItemId(id.to_string()))?;

      let count = row
        .select(&Selector::parse(":scope > td:nth-child(3) > strong").unwrap())
        .exactly_one()
        .map_err(|_| ScraperError::NonUniqueItemCount)?;
      let count = count.get_one_text().map_err(|_| ScraperError::NonUniqueItemCountText)?;
      let count: u32 = count
        .trim()
        .parse()
        .map_err(|_| ScraperError::InvalidItemCount(count.to_string()))?;

      Ok((id, count))
    })
    .collect();
  let inventory = inventory?;

  Ok(DinoparcInventoryResponse {
    session_user,
    inventory,
  })
}

pub(crate) fn scrape_collection(doc: &Html) -> Result<DinoparcCollectionResponse<DinoparcUsername>, ScraperError> {
  let root = doc.root_element();

  let context = scrape_context(root)?;
  let session_user = scrape_session_user(context.server, root)?;

  let mut rewards: Option<HashSet<DinoparcRewardId>> = None;
  let mut epic_rewards: Option<HashSet<DinoparcEpicRewardKey>> = None;

  for reward_box in root.select(&Selector::parse(".siteContent .contentPane div.rewardBox").unwrap()) {
    if reward_box
      .select(&Selector::parse(":scope > div.header").unwrap())
      .next()
      .is_some()
    {
      // Regular
      if rewards.is_some() {
        return Err(ScraperError::DuplicateRegularRewardBox);
      }
      let mut new_rewards: HashSet<DinoparcRewardId> = HashSet::new();
      for (i, cell) in reward_box
        .select(&Selector::parse(":scope table.rewards td").unwrap())
        .enumerate()
      {
        let is_unlocked = cell.select(&Selector::parse(":scope a").unwrap()).any(|_| true);
        if is_unlocked {
          let id = u64::try_from(i).unwrap() + 1;
          let id =
            DinoparcRewardId::from_str(id.to_string().as_str()).map_err(|_| ScraperError::InvalidRewardId(id))?;
          new_rewards.insert(id);
        }
      }
      rewards = Some(new_rewards);
    } else if reward_box
      .select(&Selector::parse(":scope > div.epicHeader").unwrap())
      .next()
      .is_some()
    {
      // Epic
      if epic_rewards.is_some() {
        return Err(ScraperError::DuplicateEpicRewardBox);
      }
      let mut new_epic_rewards: HashSet<DinoparcEpicRewardKey> = HashSet::new();
      for cell in reward_box.select(&Selector::parse(":scope table.rewards td").unwrap()) {
        let reward = cell
          .select(&Selector::parse(":scope img").unwrap())
          .at_most_one()
          .map_err(|_| ScraperError::MultipleEpicRewardImages)?;
        let reward = if let Some(r) = reward { r } else { continue };
        let reward = reward.value().attr("src").ok_or(ScraperError::MissingImgSrc)?;
        let reward = EPIC_REWARD_RE
          .captures(reward)
          .ok_or_else(|| ScraperError::InvalidEpicReward(reward.to_string()))?;
        let reward = reward
          .get(1)
          .expect("Epic reward capture should have a group with id 1");
        let reward: DinoparcEpicRewardKey = reward
          .as_str()
          .parse()
          .map_err(|_| ScraperError::InvalidEpicReward(reward.as_str().to_string()))?;
        new_epic_rewards.insert(reward);
      }
      epic_rewards = Some(new_epic_rewards);
    } else {
      return Err(ScraperError::UnexpectedRewardBox);
    }
  }

  Ok(DinoparcCollectionResponse {
    session_user,
    collection: DinoparcCollection {
      rewards: rewards.unwrap_or_default(),
      epic_rewards: epic_rewards.unwrap_or_default(),
    },
  })
}

pub(crate) fn scrape_exchange_with(doc: &Html) -> Result<DinoparcExchangeWithResponse<DinoparcUsername>, ScraperError> {
  let root = doc.root_element();

  let context = scrape_context(root)?;
  let session_user = scrape_session_user(context.server, root)?;

  let exchange_table = root
    .select(&Selector::parse(".siteContent .contentPane form > table").unwrap())
    .exactly_one()
    .map_err(|_| ScraperError::NonUniqueExchangeTable)?;

  let rows: Vec<ElementRef> = exchange_table
    .select(&Selector::parse(":scope > tbody > tr").unwrap())
    .collect();

  if rows.len() != 6 {
    return Err(ScraperError::UnexpectedExchangeTableLayout);
  }

  let other_user: ShortDinoparcUser = {
    let other_user = rows[0]
      .select(&Selector::parse(":scope > th > a").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueExchangeTarget)?;

    let id = {
      let other_user = other_user.value().attr("href").ok_or(ScraperError::MissingLinkHref)?;
      let other_user = DinoparcUrls::new(context.server)
        .parse_from_root(other_user)
        .map_err(|_| ScraperError::InvalidLinkHref(other_user.to_string()))?;
      let req = other_user
        .query_pairs()
        .filter_map(|(k, v)| if k.as_ref() == "r" { Some(v) } else { None })
        .exactly_one()
        .map_err(|_| ScraperError::NonUniqueDinoparcRequest)?;
      let req = DinoparcRequest::new(req.as_ref());
      let id = req
        .pairs()
        .filter_map(|(k, v)| if k == "id" { Some(v) } else { None })
        .exactly_one()
        .map_err(|_| ScraperError::NonUniqueUserIdInLink)?;
      DinoparcUserId::from_str(id).map_err(|e| ScraperError::InvalidUserId(id.to_string(), e))?
    };
    let username = {
      let username = other_user
        .get_one_text()
        .map_err(|_| ScraperError::NonUniqueUsernameText)?;
      // No trimming: already trimmed
      DinoparcUsername::from_str(username).map_err(|e| ScraperError::InvalidUsername(username.to_string(), e))?
    };
    ShortDinoparcUser {
      server: context.server,
      id,
      username,
    }
  };

  let own_bills: u32 = {
    let max_bills = rows[1]
      .select(&Selector::parse(":scope > td > span.bill").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueExchangeTarget)?;

    let max_bills = max_bills
      .text()
      .filter_map(|t| DECIMAL_RE.find(t))
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueBillCount)?;

    let max_bills = max_bills.as_str();
    let max_bills: u32 = max_bills
      .parse()
      .map_err(|e| ScraperError::InvalidBillCount(max_bills.to_string(), e))?;
    max_bills
  };

  Ok(DinoparcExchangeWithResponse {
    session_user,
    own_bills,
    own_dinoz: scrape_exchange_dinoz_list(context.server, rows[2])?,
    other_user,
    other_dinoz: scrape_exchange_dinoz_list(context.server, rows[5])?,
  })
}

fn scrape_exchange_dinoz_list(
  server: DinoparcServer,
  row: ElementRef,
) -> Result<Vec<ShortDinoparcDinozWithLevel>, ScraperError> {
  let dinoz = row
    .select(&Selector::parse(":scope > td > select").unwrap())
    .exactly_one()
    .map_err(|_| ScraperError::NonUniqueExchangeDinozList)?;

  dinoz
    .select(&Selector::parse(":scope > option").unwrap())
    .enumerate()
    .filter_map(|(i, dinoz)| if i == 0 { None } else { Some(dinoz) })
    .map(|dinoz| -> Result<ShortDinoparcDinozWithLevel, ScraperError> {
      let id = dinoz
        .value()
        .attr("value")
        .ok_or(ScraperError::MissingExchangeDinozId)?;
      let id: DinoparcDinozId = id.parse().map_err(|_| ScraperError::InvalidDinozId(id.to_string()))?;

      let name_level = dinoz
        .get_one_text()
        .map_err(|_| ScraperError::NonUniqueExchangeDinozText)?;
      let name_level = EXCHANGE_DINOZ_RE
        .captures(name_level)
        .ok_or_else(|| ScraperError::InvalidExchangeDinozNameLevel(name_level.to_string()))?;
      let name = name_level
        .get(1)
        .expect("Echange dinoz name and level capture should have a group with id 1")
        .as_str();
      let level = name_level
        .get(2)
        .expect("Echange dinoz name and level capture should have a group with id 1")
        .as_str();

      let name: Option<DinoparcDinozName> = if name == "null" {
        None
      } else {
        Some(
          name
            .parse()
            .map_err(|_| ScraperError::InvalidDinozName(name.to_string()))?,
        )
      };
      let level: u16 = level
        .parse()
        .map_err(|_| ScraperError::InvalidDinozLevel(level.to_string()))?;

      Ok(ShortDinoparcDinozWithLevel {
        server,
        id,
        name,
        level,
      })
    })
    .collect()
}

pub(crate) fn scrape_dinoz(doc: &Html) -> Result<DinoparcDinozResponse<DinoparcUsername>, ScraperError> {
  let root = doc.root_element();

  let context = scrape_context(root)?;
  let session_user = scrape_session_user(context.server, root)?;

  let content_pane = root
    .select(&Selector::parse(".siteContent .contentPane").unwrap())
    .exactly_one()
    .map_err(|_| ScraperError::NonUniqueContentPane)?;

  let dinoz_view = content_pane
    .select(&Selector::parse(":scope > table.dinoView").unwrap())
    .at_most_one()
    .map_err(|_| ScraperError::NonUniqueDinozView)?;

  let dinoz = if let Some(dinoz_view) = dinoz_view {
    let name = {
      let name = content_pane
        .select(&Selector::parse(":scope > h1").unwrap())
        .exactly_one()
        .map_err(|_| ScraperError::NonUniqueDinozName)?;
      let name = name.text().next().ok_or(ScraperError::NonUniqueDinozNameText)?;
      let name: DinoparcDinozName = name
        .trim()
        .parse()
        .map_err(|_| ScraperError::InvalidDinozName(name.to_string()))?;
      name
    };
    scrape_named_dinoz(context.server, name, dinoz_view)?
  } else {
    let dinoz_sheet = content_pane
      .select(&Selector::parse(":scope > table.dinoSheet").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozView)?;
    scrape_unnamed_dinoz(context.server, dinoz_sheet)?
  };

  Ok(DinoparcDinozResponse { session_user, dinoz })
}

fn scrape_named_dinoz(
  server: DinoparcServer,
  name: DinoparcDinozName,
  dinoz_view: ElementRef,
) -> Result<DinoparcDinoz, ScraperError> {
  let dinoz_pane = dinoz_view
    .select(&Selector::parse(":scope div.dino").unwrap())
    .exactly_one()
    .map_err(|_| ScraperError::NonUniqueDinozPane)?;

  let skin = {
    let skin = dinoz_pane
      .select(&Selector::parse(":scope > div.pic.center object > param[name=FlashVars]").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozSkinFlashVars)?;
    let skin = skin.value().attr("value").ok_or(ScraperError::MissingFlashVarsValue)?;
    let skin: &str = FlashVars::new(skin)
      .into_iter()
      .filter_map(|(k, v)| if k == "data" { Some(v) } else { None })
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozSkinData)?;
    skin.to_string()
  };

  let def = dinoz_pane
    .select(&Selector::parse(":scope > table.def").unwrap())
    .exactly_one()
    .map_err(|_| ScraperError::NonUniqueDinozDefTable)?;

  let life = {
    let life = def
      .select(&Selector::parse(":scope tr:nth-child(2) td div.value").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozLifeValue)?;
    let life = life
      .get_one_text()
      .map_err(|_| ScraperError::NonUniqueDinozLifeValueText)?;
    parse_percentage(life).map_err(|_| ScraperError::InvalidDinozLifeValue(life.to_string()))?
  };
  let level = {
    let level = def
      .select(&Selector::parse(":scope tr:nth-child(3) td").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozLevel)?;

    let level = level.text().next().ok_or(ScraperError::MissingDinozLevelText)?;
    let level = DECIMAL_RE.find(level).ok_or(ScraperError::MissingDinozLevelDecimal)?;
    let level = level.as_str();

    let level: u16 = level
      .parse()
      .map_err(|_| ScraperError::InvalidDinozLevel(level.to_string()))?;
    level
  };
  let experience = {
    let experience = def
      .select(&Selector::parse(":scope tr:nth-child(4) td").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozExperience)?;

    let can_level_up = experience
      .select(&Selector::parse(":scope > a").unwrap())
      .next()
      .is_some();

    if can_level_up {
      IntPercentage::new(100).unwrap()
    } else {
      let experience = experience
        .select(&Selector::parse(":scope div.value").unwrap())
        .exactly_one()
        .map_err(|_| ScraperError::NonUniqueDinozExperienceValue)?;
      let experience = experience
        .get_one_text()
        .map_err(|_| ScraperError::NonUniqueDinozExperienceValueText)?;
      parse_percentage(experience).map_err(|_| ScraperError::InvalidDinozExperienceValue(experience.to_string()))?
    }
  };
  let danger = {
    let danger = def
      .select(&Selector::parse(":scope tr:nth-child(5) td").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozDanger)?;
    let danger = danger.text().next().ok_or(ScraperError::MissingDinozDangerText)?;
    let danger: i16 = danger
      .trim()
      .parse()
      .map_err(|_| ScraperError::InvalidDinozDanger(danger.to_string()))?;
    danger
  };

  let elements: DinoparcDinozElements = {
    let elements = dinoz_pane
      .select(&Selector::parse(":scope > ul.elements").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozElementList)?;

    let elements: Result<Vec<u16>, ScraperError> = elements
      .select(&Selector::parse(":scope > li > div").unwrap())
      .map(|element| -> Result<u16, ScraperError> {
        let element = element
          .get_one_text()
          .map_err(|_| ScraperError::NonUniqueDinozElementText)?;
        let element: u16 = element
          .parse()
          .map_err(|_| ScraperError::InvalidDinozElement(element.to_string()))?;
        Ok(element)
      })
      .collect();

    let elements = elements?;
    let elements_count = elements.len();
    let elements: [u16; 5] = elements.try_into().map_err(|_| {
      ScraperError::InvalidDinozElementCount(
        elements_count
          .try_into()
          .expect("Expected elements size to fit 64 bits"),
      )
    })?;

    DinoparcDinozElements {
      fire: elements[0],
      earth: elements[1],
      water: elements[2],
      thunder: elements[3],
      air: elements[4],
    }
  };

  let skills: HashMap<DinoparcSkill, DinoparcSkillLevel> = {
    let skills = dinoz_pane
      .select(&Selector::parse(":scope > ul.skills").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozSkillList)?;

    let skills: Result<HashMap<DinoparcSkill, DinoparcSkillLevel>, ScraperError> = skills
      .select(&Selector::parse(":scope > li").unwrap())
      .map(|skill| -> Result<(DinoparcSkill, DinoparcSkillLevel), ScraperError> {
        let name = skill
          .select(&Selector::parse(":scope > div.name").unwrap())
          .exactly_one()
          .map_err(|_| ScraperError::NonUniqueDinozSkillName)?;
        let name = name
          .get_one_text()
          .map_err(|_| ScraperError::NonUniqueDinozSkillNameText)?;
        let name = ScraperLocale::get(server)
          .skill_names
          .get(name)
          .cloned()
          .ok_or_else(|| ScraperError::InvalidSkillName(name.to_string()))?;

        let level = skill
          .select(&Selector::parse(":scope > div.level > img").unwrap())
          .exactly_one()
          .map_err(|_| ScraperError::NonUniqueDinozSkillLevel)?;

        let level = level.value().attr("src").ok_or(ScraperError::MissingImgSrc)?;
        let level = SKILL_LEVEL_RE
          .captures(level)
          .ok_or_else(|| ScraperError::InvalidDinozSkillLevel(level.to_string()))?;
        let level = level.get(1).expect("Skill level capture should have a group with id 1");
        let level: u8 = level
          .as_str()
          .parse()
          .expect("Captured skill level must be parsable as u8");
        let level = DinoparcSkillLevel::new(level).expect("Captured skill level must be in range");
        Ok((name, level))
      })
      .collect();

    skills?
  };

  let actions = dinoz_view
    .select(&Selector::parse(":scope div.actions").unwrap())
    .exactly_one()
    .map_err(|_| ScraperError::NonUniqueActionsPane)?;

  let in_tournament = {
    actions
      .select(&Selector::parse(":scope > div.important").unwrap())
      .any(|important| {
        important
          .text()
          .any(|t| ScraperLocale::get(server).in_tournament_pattern.is_match(t))
      })
  };

  let place = dinoz_view
    .select(&Selector::parse(":scope div.place").unwrap())
    .exactly_one()
    .map_err(|_| ScraperError::NonUniquePlacePane)?;

  let location = {
    let location = place
      .select(&Selector::parse(":scope > div.title").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueLocationName)?;
    let location = location
      .get_one_text()
      .map_err(|_| ScraperError::NonUniqueLocationNameText)?;
    ScraperLocale::get(server)
      .location_names
      .get(location)
      .cloned()
      .ok_or_else(|| ScraperError::InvalidLocationName(location.to_string()))?
  };

  let id = {
    let place_link = place
      .select(&Selector::parse(":scope > div.link > a").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniquePlaceLink)?;
    let place_link = place_link.value().attr("href").ok_or(ScraperError::MissingLinkHref)?;
    let place_link = DinoparcUrls::new(server)
      .parse_from_root(place_link)
      .map_err(|_| ScraperError::InvalidLinkHref(place_link.to_string()))?;
    let req = place_link
      .query_pairs()
      .filter_map(|(k, v)| if k.as_ref() == "r" { Some(v) } else { None })
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinoparcRequest)?;
    let req = DinoparcRequest::new(req.as_ref());
    let id = req
      .pairs()
      .filter_map(|(k, v)| if k == "id" { Some(v) } else { None })
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozIdInLink)?;
    DinoparcDinozId::from_str(id).map_err(|_| ScraperError::InvalidDinozId(id.to_string()))?
  };

  Ok(DinoparcDinoz {
    server,
    id,
    race: DinoparcDinozRace::from_skin_code(skin.as_str()),
    skin: skin
      .parse()
      .map_err(|_| ScraperError::InvalidDinozSkin(skin.to_string()))?,
    level,
    named: Some(NamedDinoparcDinozFields {
      name,
      location,
      life,
      experience,
      danger,
      in_tournament,
      elements,
      skills,
    }),
  })
}

fn scrape_unnamed_dinoz(server: DinoparcServer, dinoz_sheet: ElementRef) -> Result<DinoparcDinoz, ScraperError> {
  let skin = {
    let skin = dinoz_sheet
      .select(&Selector::parse(":scope td.picBox object > param[name=FlashVars]").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozSkinFlashVars)?;
    let skin = skin.value().attr("value").ok_or(ScraperError::MissingFlashVarsValue)?;
    let skin: &str = FlashVars::new(skin)
      .into_iter()
      .filter_map(|(k, v)| if k == "data" { Some(v) } else { None })
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozSkinData)?;
    skin.to_string()
  };

  let form = dinoz_sheet
    .select(&Selector::parse(":scope form").unwrap())
    .exactly_one()
    .map_err(|_| ScraperError::NonUniqueDinozNameForm)?;

  let id = {
    let form_action = form.value().attr("action").ok_or(ScraperError::MissingFormAction)?;
    let form_action = DinoparcUrls::new(server)
      .parse_from_root(form_action)
      .map_err(|_| ScraperError::InvalidFormAction(form_action.to_string()))?;
    let req = form_action
      .query_pairs()
      .filter_map(|(k, v)| if k.as_ref() == "r" { Some(v) } else { None })
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinoparcRequest)?;
    let req = DinoparcRequest::new(req.as_ref());
    let id = req
      .pairs()
      .filter_map(|(k, v)| if k == "id" { Some(v) } else { None })
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozIdInLink)?;
    DinoparcDinozId::from_str(id).map_err(|_| ScraperError::InvalidDinozId(id.to_string()))?
  };

  let def = form
    .select(&Selector::parse(":scope > table.def").unwrap())
    .exactly_one()
    .map_err(|_| ScraperError::NonUniqueDinozDefTable)?;

  let level = {
    let level = def
      .select(&Selector::parse(":scope tr:nth-child(1) td").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozLevel)?;

    let level = level.text().next().ok_or(ScraperError::MissingDinozLevelText)?;
    let level = DECIMAL_RE.find(level).ok_or(ScraperError::MissingDinozLevelDecimal)?;
    let level = level.as_str();

    let level: u16 = level
      .parse()
      .map_err(|_| ScraperError::InvalidDinozLevel(level.to_string()))?;
    level
  };

  Ok(DinoparcDinoz {
    server,
    id,
    race: DinoparcDinozRace::from_skin_code(skin.as_str()),
    skin: skin
      .parse()
      .map_err(|_| ScraperError::InvalidDinozSkin(skin.to_string()))?,
    level,
    named: None,
  })
}

fn parse_percentage(raw: &str) -> Result<IntPercentage, ScraperError> {
  match PERCENTAGE_RE.captures(raw) {
    None => Err(ScraperError::InvalidPercentage(raw.to_string())),
    Some(cap) => {
      let matched = cap.get(1).expect("Capture should have a group with id 1");
      let percentage: u8 = matched
        .as_str()
        .parse()
        .expect("Captured percentage must be parsable as u8");
      let percentage = IntPercentage::new(percentage).expect("Captured percentage must be in range");
      Ok(percentage)
    }
  }
}

fn scrape_session_user(
  server: DinoparcServer,
  doc: ElementRef,
) -> Result<DinoparcSessionUser<DinoparcUsername>, ScraperError> {
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
    DinoparcUsername::from_str(username).map_err(|e| ScraperError::InvalidUsername(username.to_string(), e))?;

  let coins = {
    let coins = menu
      .select(&Selector::parse(":scope span.money").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueCoinSpan)?;
    let coin_text = coins.get_one_text().map_err(|_| ScraperError::NonUniqueCoinText)?;
    let coins: u32 = coin_text
      .trim()
      .parse()
      .map_err(|_| ScraperError::InvalidCoinCount(coin_text.to_string()))?;
    coins
  };

  let dinoz = {
    let block = menu
      .select(&Selector::parse(":scope > #dinozListBlock").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozListBlock)?;

    let dinoz_list = block
      .select(&Selector::parse(":scope > ul.dinoList").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozList)?;

    let dinoz: Result<Vec<ShortDinoparcDinozWithLocation>, ScraperError> = dinoz_list
      .select(&Selector::parse(":scope > li").unwrap())
      .map(|e| scrape_sidebar_dinoz(server, e))
      .collect();
    dinoz?
  };

  Ok(DinoparcSessionUser {
    user: username,
    coins,
    dinoz,
  })
}

fn scrape_sidebar_dinoz(
  server: DinoparcServer,
  dinoz: ElementRef,
) -> Result<ShortDinoparcDinozWithLocation, ScraperError> {
  let id = {
    let link: ElementRef = dinoz
      .select(&Selector::parse(":scope > a").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozLink)?;
    let link = link.value().attr("href").ok_or(ScraperError::MissingLinkHref)?;
    let link = DinoparcUrls::new(server)
      .parse_from_root(link)
      .map_err(|_| ScraperError::InvalidLinkHref(link.to_string()))?;
    let req = link
      .query_pairs()
      .filter_map(|(k, v)| if k.as_ref() == "r" { Some(v) } else { None })
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinoparcRequest)?;
    let req = DinoparcRequest::new(req.as_ref());
    let id = req
      .pairs()
      .filter_map(|(k, v)| if k == "id" { Some(v) } else { None })
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueDinozIdInLink)?;
    DinoparcDinozId::from_str(id).map_err(|_| ScraperError::InvalidDinozId(id.to_string()))?
  };
  let name = {
    let name = dinoz
      .select(&Selector::parse(":scope p.name").unwrap())
      .at_most_one()
      .map_err(|_| ScraperError::NonUniqueDinozName)?;
    if let Some(name) = name {
      let name = name.get_one_text().map_err(|_| ScraperError::NonUniqueDinozNameText)?;
      // No trimming: already trimmed
      Some(DinoparcDinozName::from_str(name).map_err(|_| ScraperError::InvalidDinozName(name.to_string()))?)
    } else if dinoz
      .select(&Selector::parse(":scope p.notify").unwrap())
      .next()
      .is_some()
    {
      // Unnamed dinoz, the `p.notify` is the "Pick a name" prompt
      None
    } else {
      // No name or prompt to pick a name
      return Err(ScraperError::NonUniqueDinozName);
    }
  };
  let location = if name.is_some() {
    let location = dinoz
      .select(&Selector::parse(":scope p.placeName").unwrap())
      .exactly_one()
      .map_err(|_| ScraperError::NonUniqueLocationName)?;
    let location = location
      .get_one_text()
      .map_err(|_| ScraperError::NonUniqueLocationNameText)?;
    let location = ScraperLocale::get(server)
      .location_names
      .get(location)
      .cloned()
      .ok_or_else(|| ScraperError::InvalidLocationName(location.to_string()))?;
    Some(location)
  } else {
    None
  };

  Ok(ShortDinoparcDinozWithLocation {
    server,
    id,
    name,
    location,
  })
}

#[cfg(test)]
mod test {
  use crate::http::scraper::{
    scrape_bank, scrape_collection, scrape_dinoz, scrape_exchange_with, scrape_inventory, BankScraping,
  };
  use etwin_core::dinoparc::{
    DinoparcCollectionResponse, DinoparcDinozResponse, DinoparcExchangeWithResponse, DinoparcInventoryResponse,
    DinoparcUsername,
  };
  use scraper::Html;
  use std::path::{Path, PathBuf};
  use test_generator::test_resources;

  #[test_resources("./test-resources/scraping/dinoparc/bank/*/")]
  fn test_scrape_bank(path: &str) {
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

  #[test_resources("./test-resources/scraping/dinoparc/dinoz/*/")]
  fn test_scrape_dinoz(path: &str) {
    let path: PathBuf = Path::join(Path::new("../.."), path);
    let value_path = path.join("value.json");
    let html_path = path.join("main.utf8.html");
    let actual_path = path.join("rs.actual.json");

    let raw_html = ::std::fs::read_to_string(html_path).expect("Failed to read html file");

    let html = Html::parse_document(&raw_html);

    let actual = scrape_dinoz(&html).unwrap();
    let actual_json = serde_json::to_string_pretty(&actual).unwrap();
    ::std::fs::write(actual_path, format!("{}\n", actual_json)).expect("Failed to write actual file");

    let value_json = ::std::fs::read_to_string(value_path).expect("Failed to read value file");
    let expected =
      serde_json::from_str::<DinoparcDinozResponse<DinoparcUsername>>(&value_json).expect("Failed to parse value file");

    assert_eq!(actual, expected);
  }

  #[test_resources("./test-resources/scraping/dinoparc/inventory/*/")]
  fn test_scrape_inventory(path: &str) {
    let path: PathBuf = Path::join(Path::new("../.."), path);
    let value_path = path.join("value.json");
    let html_path = path.join("main.utf8.html");
    let actual_path = path.join("rs.actual.json");

    let raw_html = ::std::fs::read_to_string(html_path).expect("Failed to read html file");

    let html = Html::parse_document(&raw_html);

    let actual = scrape_inventory(&html).unwrap();
    let actual_json = serde_json::to_string_pretty(&actual).unwrap();
    ::std::fs::write(actual_path, format!("{}\n", actual_json)).expect("Failed to write actual file");

    let value_json = ::std::fs::read_to_string(value_path).expect("Failed to read value file");
    let expected = serde_json::from_str::<DinoparcInventoryResponse<DinoparcUsername>>(&value_json)
      .expect("Failed to parse value file");

    assert_eq!(actual, expected);
  }

  #[test_resources("./test-resources/scraping/dinoparc/collection/*/")]
  fn test_scrape_collection(path: &str) {
    let path: PathBuf = Path::join(Path::new("../.."), path);
    let value_path = path.join("value.json");
    let html_path = path.join("main.utf8.html");
    let actual_path = path.join("rs.actual.json");

    let raw_html = ::std::fs::read_to_string(html_path).expect("Failed to read html file");

    let html = Html::parse_document(&raw_html);

    let actual = scrape_collection(&html).unwrap();
    let actual_json = serde_json::to_string_pretty(&actual).unwrap();
    ::std::fs::write(actual_path, format!("{}\n", actual_json)).expect("Failed to write actual file");

    let value_json = ::std::fs::read_to_string(value_path).expect("Failed to read value file");
    let expected = serde_json::from_str::<DinoparcCollectionResponse<DinoparcUsername>>(&value_json)
      .expect("Failed to parse value file");

    assert_eq!(actual, expected);
  }

  #[test_resources("./test-resources/scraping/dinoparc/exchange-with/*/")]
  fn test_scrape_exchange_with(path: &str) {
    let path: PathBuf = Path::join(Path::new("../.."), path);
    let value_path = path.join("value.json");
    let html_path = path.join("main.utf8.html");
    let actual_path = path.join("rs.actual.json");

    let raw_html = ::std::fs::read_to_string(html_path).expect("Failed to read html file");

    let html = Html::parse_document(&raw_html);

    let actual = scrape_exchange_with(&html).unwrap();
    let actual_json = serde_json::to_string_pretty(&actual).unwrap();
    ::std::fs::write(actual_path, format!("{}\n", actual_json)).expect("Failed to write actual file");

    let value_json = ::std::fs::read_to_string(value_path).expect("Failed to read value file");
    let expected = serde_json::from_str::<DinoparcExchangeWithResponse<DinoparcUsername>>(&value_json)
      .expect("Failed to parse value file");

    assert_eq!(actual, expected);
  }
}
