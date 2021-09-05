use crate::http::errors::ScraperError;
use crate::http::url::PopotamoUrls;
use etwin_core::popotamo::PopotamoEfficiency;
use etwin_core::popotamo::PopotamoGamePlayed;
use etwin_core::popotamo::PopotamoNbCupWon;
use etwin_core::popotamo::PopotamoScore;
use etwin_core::popotamo::PopotamoSubProfile;
use etwin_core::popotamo::PopotamoSubProfileId;
use etwin_core::popotamo::PopotamoUserBirthDate;
use etwin_core::popotamo::PopotamoUserCity;
use etwin_core::popotamo::PopotamoUserCountry;
use etwin_core::popotamo::PopotamoUserCreationDate;
use etwin_core::popotamo::PopotamoUserEfficiency;
use etwin_core::popotamo::PopotamoUserHandicap;
use etwin_core::popotamo::PopotamoUserItem;
use etwin_core::popotamo::PopotamoUserLeaderboard;
use etwin_core::popotamo::PopotamoUserPersonalInfos;
use etwin_core::popotamo::PopotamoUserRank;
use etwin_core::popotamo::PopotamoUserSex;
use etwin_core::popotamo::PopotamoUserSkill;
use etwin_core::popotamo::PopotamoUserSkills;
use etwin_core::popotamo::PopotamoUserUniqueReward;
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

pub(crate) struct ScraperContext {
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

pub(crate) fn scrape_id(doc: &Html, scraper_context: &ScraperContext) -> Result<PopotamoUserId, ScraperError> {
  let profile_user_id_link = doc
    .select(selector!("a.position"))
    .next()
    .ok_or(ScraperError::MissingProfileUserIdLink)?;

  let profile_user_id_href = profile_user_id_link
    .value()
    .attr("href")
    .ok_or(ScraperError::MissingLinkHref)?;

  let profile_user_id_url = PopotamoUrls::new(scraper_context.server)
    .parse_from_root(profile_user_id_href)
    .map_err(|_| ScraperError::InvalidUserLink(profile_user_id_href.to_string()))?;

  let profile_user_id_url_string: String = profile_user_id_url.to_string();

  let profile_user_id: Option<&str> = profile_user_id_url_string.split('=').nth(1);

  let profile_user_id =
    profile_user_id.ok_or_else(|| ScraperError::InvalidUserLink(profile_user_id_href.to_string()))?;
  let profile_user_id =
    PopotamoUserId::from_str(profile_user_id).map_err(|_| ScraperError::InvalidUserId(profile_user_id.to_string()))?;

  Ok(profile_user_id)
}

pub(crate) fn scrape_username(doc: &Html) -> Result<PopotamoUsername, ScraperError> {
  let profile_username_h2 = doc
    .select(selector!("h2.mainsheet"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingH2Selector)?;

  let profile_username_text = profile_username_h2
    .text()
    .nth(5)
    .ok_or(ScraperError::MissingProfileUsername)?;

  let profile_username_no_spaces = profile_username_text
    .split(' ')
    .nth(1)
    .ok_or(ScraperError::MissingProfileUsername)?;

  let profile_username_clean = profile_username_no_spaces
    .split('\n')
    .next()
    .ok_or(ScraperError::MissingProfileUsername)?;

  let profile_username: PopotamoUsername = profile_username_clean
    .parse()
    .map_err(|_| ScraperError::InvalidUsername(profile_username_clean.to_string()))?;

  Ok(profile_username)
}

pub(crate) fn scrape_rank(doc: &Html) -> Result<PopotamoUserRank, ScraperError> {
  let rank_a = doc
    .select(selector!("a.position"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingRankSelector)?;

  let rank_text = rank_a
    .text()
    .exactly_one()
    .map_err(|_| ScraperError::MissingRank)?
    .split(' ')
    .nth(1)
    .ok_or(ScraperError::IteratorErrorRank)?;

  let rank: PopotamoUserRank = rank_text
    .parse()
    .map_err(|_| ScraperError::InvalidRank(rank_text.to_string()))?;

  Ok(rank)
}

pub(crate) fn scrape_score(doc: &Html) -> Result<PopotamoScore, ScraperError> {
  let score_a = doc
    .select(selector!("span.score"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingScoreSelector)?;

  let score_text = score_a
    .text()
    .exactly_one()
    .map_err(|_| ScraperError::MissingScore)?
    .split(' ')
    .nth(1)
    .ok_or(ScraperError::IteratorErrorScore)?;

  let score: PopotamoScore = score_text
    .parse()
    .map_err(|_| ScraperError::InvalidScore(score_text.to_string()))?;

  Ok(score)
}

pub(crate) fn scrape_leaderboard(doc: &Html) -> Result<PopotamoUserLeaderboard, ScraperError> {
  let lb_h2 = doc
    .select(selector!("h2.mainsheet"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingH2Selector)?;

  let lb_a = lb_h2
    .select(selector!("img"))
    .next()
    .ok_or(ScraperError::MissingLeaderboardSelector)?;

  let lb_src = lb_a.value().attr("src").ok_or(ScraperError::MissingLeaderboardSRC)?;

  let lb_str = lb_src
    .split('/')
    .nth(3)
    .ok_or(ScraperError::IteratorErrorLB)?
    .split('.')
    .next()
    .ok_or(ScraperError::IteratorErrorLB)?;

  let lb: PopotamoUserLeaderboard = lb_str
    .parse()
    .map_err(|_| ScraperError::InvalidLeaderboard(lb_str.to_string()))?;

  Ok(lb)
}

pub(crate) fn scrape_moderator_status(doc: &Html) -> Result<bool, ScraperError> {
  let mod_h2 = doc
    .select(selector!("h2.mainsheet"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingH2Selector)?;

  let mod_selector = Selector::parse(r"[alt='Modérateur']").unwrap();

  let moderator_img = mod_h2
    .select(&mod_selector)
    .next()
    .ok_or(ScraperError::MissingModeratorStatus);

  let ismoderator = moderator_img.is_ok();

  Ok(ismoderator)
}

pub(crate) fn scrape_nb_cup_won(doc: &Html) -> Result<PopotamoNbCupWon, ScraperError> {
  let mut nb_cups: PopotamoNbCupWon = "0".parse().unwrap();

  let cups = doc
    .select(selector!("div.pricesheet"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingCupsSelector);

  let nb_cups_not_clean = cups?
    .text()
    .next()
    .ok_or(ScraperError::MissingNbCupWonValue)?
    .split("\t\t\t")
    .nth(1)
    .ok_or(ScraperError::IteratorErrorCups);

  let nb_cups_str;

  if nb_cups_not_clean.is_ok() {
    nb_cups_str = nb_cups_not_clean?
      .split(' ')
      .next()
      .ok_or(ScraperError::IteratorErrorCups)?;

    nb_cups = nb_cups_str
      .parse()
      .map_err(|_| ScraperError::InvalidNbCupWonValue(nb_cups_str.to_string()))?;
  }

  Ok(nb_cups)
}

pub(crate) fn scrape_unique_rewards(doc: &Html) -> Result<Vec<PopotamoUserUniqueReward>, ScraperError> {
  let unique_rewards_div = doc
    .select(selector!("div.rewardsLeft"))
    .exactly_one()
    .map_err(|_| ScraperError::MissinguniqueRewardsSelector);

  let mut rewards: Vec<PopotamoUserUniqueReward> = Vec::new();

  if unique_rewards_div.is_ok() {
    for element in unique_rewards_div?.select(selector!("img")) {
      let ref_reward = element
        .value()
        .attr("src")
        .ok_or(ScraperError::MissingUniqueRewardLink)?
        .split('/')
        .nth(3)
        .ok_or(ScraperError::IteratorErrorRewards1)?
        .split('.')
        .next()
        .ok_or(ScraperError::IteratorErrorRewards2)?;

      let reward: PopotamoUserUniqueReward = ref_reward
        .parse()
        .map_err(|_| ScraperError::InvalidUniqueRewardName(ref_reward.to_string()))?;

      rewards.push(reward);
    }
  }

  Ok(rewards)
}

pub(crate) fn scrape_creation_date(doc: &Html) -> Result<PopotamoUserCreationDate, ScraperError> {
  let ul_selector = Selector::parse(r"[style='margin-left: 100px;']").unwrap();

  let creation_date_ul = doc
    .select(&ul_selector)
    .exactly_one()
    .map_err(|_| ScraperError::MissingCreationDateSelector)?;

  let creation_date_li = creation_date_ul
    .select(selector!("li"))
    .nth(1)
    .ok_or(ScraperError::MissingCreationDate)?;

  let creation_date_str = creation_date_li
    .text()
    .next()
    .ok_or(ScraperError::IteratorErrorCreationDate1)?
    .split(" : ")
    .nth(1)
    .ok_or(ScraperError::IteratorErrorCreationDate2)?;

  let creation_date: PopotamoUserCreationDate = creation_date_str
    .parse()
    .map_err(|_| ScraperError::InvalidCreationDate(creation_date_str.to_string()))?;

  Ok(creation_date)
}

pub(crate) fn scrape_items(sub_profile_div: &ElementRef) -> Result<Vec<PopotamoUserItem>, ScraperError> {
  let profile_items_td = sub_profile_div
    .select(selector!("td.opt"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingProfileUserItems)?;

  let mut items: Vec<PopotamoUserItem> = Vec::new();

  for element in profile_items_td.select(selector!("img")) {
    let ref_item = element
      .value()
      .attr("alt")
      .ok_or(ScraperError::MissingProfileUserItem)?;

    let item: PopotamoUserItem = ref_item
      .parse()
      .map_err(|_| ScraperError::InvalidItemName(ref_item.to_string()))?;

    items.push(item);
  }

  Ok(items)
}

pub(crate) fn scrape_sub_profile_id(sub_profile_div: &ElementRef) -> Result<PopotamoSubProfileId, ScraperError> {
  let str_id = sub_profile_div
    .value()
    .attr("id")
    .ok_or(ScraperError::MissingIDAttribute)?
    .split('_')
    .nth(1)
    .ok_or(ScraperError::IteratorErrorSubProfileId)?;

  let id = PopotamoSubProfileId::from_str(str_id).map_err(|_| ScraperError::InvalidSubProfileId(str_id.to_string()))?;

  Ok(id)
}

pub(crate) fn scrape_handicap(sub_profile_div: &ElementRef) -> Result<PopotamoUserHandicap, ScraperError> {
  let str_handicap = sub_profile_div
    .select(selector!("td.pst"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingHandicapTDSelector)?
    .text()
    .exactly_one()
    .map_err(|_| ScraperError::MissingHandicapValue)?;

  let handicap = PopotamoUserHandicap::from_str(str_handicap)
    .map_err(|_| ScraperError::InvalidHandicapValue(str_handicap.to_string()))?;

  Ok(handicap)
}
pub(crate) fn scrape_game_played(sub_profile_div: &ElementRef) -> Result<PopotamoGamePlayed, ScraperError> {
  let str_game_played = sub_profile_div
    .select(selector!("td.gpl"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingGamePlayedTDSelector)?
    .text()
    .exactly_one()
    .map_err(|_| ScraperError::MissingGamePlayedValue)?;

  let game_played = PopotamoGamePlayed::from_str(str_game_played)
    .map_err(|_| ScraperError::InvalidGamePlayedValue(str_game_played.to_string()))?;

  Ok(game_played)
}

pub(crate) fn scrape_speed(sub_profile_div: &ElementRef) -> Result<PopotamoUserSkill, ScraperError> {
  let str_speed = sub_profile_div
    .select(selector!("div.nmb"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingSpeedDivSelector)?
    .text()
    .exactly_one()
    .map_err(|_| ScraperError::MissingSpeedValue)?;

  let speed =
    PopotamoUserSkill::from_str(str_speed).map_err(|_| ScraperError::InvalidSpeedValue(str_speed.to_string()))?;

  Ok(speed)
}

pub(crate) fn scrape_creativity(sub_profile_div: &ElementRef) -> Result<PopotamoUserSkill, ScraperError> {
  let str_creativity = sub_profile_div
    .select(selector!("div.nmbc"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingCreativityDivSelector)?
    .text()
    .exactly_one()
    .map_err(|_| ScraperError::MissingCreativityValue)?;

  let creativity = PopotamoUserSkill::from_str(str_creativity)
    .map_err(|_| ScraperError::InvalidCreativityValue(str_creativity.to_string()))?;

  Ok(creativity)
}

pub(crate) fn scrape_wisdom(sub_profile_div: &ElementRef) -> Result<PopotamoUserSkill, ScraperError> {
  let str_wisdom = sub_profile_div
    .select(selector!("div.nmbw"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingWisdomDivSelector)?
    .text()
    .exactly_one()
    .map_err(|_| ScraperError::MissingWisdomValue)?;

  let wisdom =
    PopotamoUserSkill::from_str(str_wisdom).map_err(|_| ScraperError::InvalidWisdomValue(str_wisdom.to_string()))?;

  Ok(wisdom)
}

pub(crate) fn scrape_efficiency(sub_profile_div: &ElementRef) -> Result<PopotamoUserEfficiency, ScraperError> {
  let efficiency_div = sub_profile_div
    .select(selector!("div.efic"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingProfileEfficiency)?;

  let mut effs: Vec<PopotamoEfficiency> = Vec::new();

  for element in efficiency_div.select(selector!("td.numb")) {
    let ref_eff = element
      .text()
      .exactly_one()
      .map_err(|_| ScraperError::MissingEfficiencyValue)?;

    let eff: PopotamoEfficiency = ref_eff
      .parse()
      .map_err(|_| ScraperError::InvalidEfficiencyValue(ref_eff.to_string()))?;

    effs.push(eff);
  }

  let efficiency = PopotamoUserEfficiency {
    first_place: effs[0],
    second_place: effs[1],
    third_place: effs[2],
    fourth_place: effs[3],
    fifth_place: effs[4],
  };

  Ok(efficiency)
}

pub(crate) fn scrape_sub_profiles(doc: &Html) -> Result<Vec<PopotamoSubProfile>, ScraperError> {
  let mut sub_profiles: Vec<PopotamoSubProfile> = Vec::new();

  let div_selector = Selector::parse("div[id^='profile_']").unwrap();

  let sub_profile_divs = doc.select(&div_selector);

  for sub_profile_div in sub_profile_divs {
    sub_profiles.push(PopotamoSubProfile {
      id: scrape_sub_profile_id(&sub_profile_div)?,
      items: scrape_items(&sub_profile_div)?,
      handicap: scrape_handicap(&sub_profile_div)?,
      game_played: scrape_game_played(&sub_profile_div)?,
      skills: PopotamoUserSkills {
        speed: scrape_speed(&sub_profile_div)?,
        creativity: scrape_creativity(&sub_profile_div)?,
        wisdom: scrape_wisdom(&sub_profile_div)?,
      },
      efficiency: scrape_efficiency(&sub_profile_div)?,
    });
  }

  Ok(sub_profiles)
}

pub(crate) fn scrape_sex(personal_infos_ul: &ElementRef) -> Result<PopotamoUserSex, ScraperError> {
  let sex_str = personal_infos_ul
    .select(selector!("li"))
    .next()
    .ok_or(ScraperError::MissingSexSelector)?
    .text()
    .nth(1)
    .ok_or(ScraperError::IteratorErrorSex)?;

  let mut sex: PopotamoUserSex = PopotamoUserSex::Homme;

  if sex_str == "femme " {
    sex = PopotamoUserSex::Femme;
  } else if sex_str == "homme " {
    sex = PopotamoUserSex::Homme;
  }
  Ok(sex)
}

pub(crate) fn scrape_birth_date(personal_infos_ul: &ElementRef) -> Result<PopotamoUserBirthDate, ScraperError> {
  let birth_date_li = personal_infos_ul
    .select(selector!("li"))
    .nth(1)
    .ok_or(ScraperError::MissingBirthDateSelector)?;

  let birth_date_label = birth_date_li.text().next().ok_or(ScraperError::IteratorErrorBD1)?;

  let mut birth_date_str = "";

  if birth_date_label == "Anniversaire : " {
    birth_date_str = birth_date_li
      .text()
      .nth(1)
      .ok_or(ScraperError::IteratorErrorBD2)?
      .split("le ")
      .nth(1)
      .ok_or(ScraperError::IteratorErrorBD2)?;
  }

  let birth_date: PopotamoUserBirthDate = birth_date_str
    .parse()
    .map_err(|_| ScraperError::InvalidBirthDate(birth_date_str.to_string()))?;

  Ok(birth_date)
}

pub(crate) fn scrape_city(personal_infos_ul: &ElementRef) -> Result<PopotamoUserCity, ScraperError> {
  //if city field is the third member of the iterator
  let mut city_li = personal_infos_ul
    .select(selector!("li"))
    .nth(2)
    .ok_or(ScraperError::MissingCitySelector)?;

  let mut city_label = city_li.text().next().ok_or(ScraperError::IteratorErrorCity)?;

  let mut city_str = "";

  if city_label == "Ville : " {
    city_str = city_li.text().nth(1).ok_or(ScraperError::IteratorErrorCity)?
  }
  //if city is the second member of the iterator
  else {
    city_li = personal_infos_ul
      .select(selector!("li"))
      .nth(1)
      .ok_or(ScraperError::MissingCitySelector)?;

    city_label = city_li.text().next().ok_or(ScraperError::IteratorErrorCity)?;

    if city_label == "Ville : " {
      city_str = city_li.text().nth(1).ok_or(ScraperError::IteratorErrorCity)?
    }
  }

  let city: PopotamoUserCity = city_str
    .parse()
    .map_err(|_| ScraperError::InvalidCity(city_str.to_string()))?;

  Ok(city)
}

pub(crate) fn scrape_country(personal_infos_ul: &ElementRef) -> Result<PopotamoUserCountry, ScraperError> {
  let country_str = personal_infos_ul
    .select(selector!("li"))
    .last()
    .ok_or(ScraperError::MissingCountrySelector)?
    .text()
    .nth(1)
    .ok_or(ScraperError::IteratorErrorCountry)?;

  let country: PopotamoUserCountry = country_str
    .parse()
    .map_err(|_| ScraperError::InvalidCountry(country_str.to_string()))?;

  Ok(country)
}

pub(crate) fn scrape_personal_infos(doc: &Html) -> Result<PopotamoUserPersonalInfos, ScraperError> {
  let personal_infos_ul = doc
    .select(selector!("ul.hisself"))
    .exactly_one()
    .map_err(|_| ScraperError::MissingPersonalInfosSelector)?;

  let mut sex: Option<PopotamoUserSex> = None;
  let mut birth_date: Option<PopotamoUserBirthDate> = None;
  let mut city: Option<PopotamoUserCity> = None;
  let mut country: Option<PopotamoUserCountry> = None;

  if scrape_sex(&personal_infos_ul).is_ok() {
    sex = Some(scrape_sex(&personal_infos_ul)?);
  }
  if scrape_birth_date(&personal_infos_ul).is_ok() {
    birth_date = Some(scrape_birth_date(&personal_infos_ul)?);
  }
  if scrape_city(&personal_infos_ul).is_ok() {
    city = Some(scrape_city(&personal_infos_ul)?);
  }
  if scrape_country(&personal_infos_ul).is_ok() {
    country = Some(scrape_country(&personal_infos_ul)?);
  }

  let personal_infos = PopotamoUserPersonalInfos {
    sex,
    birth_date,
    city,
    country,
  };

  Ok(personal_infos)
}

pub(crate) fn scrape_profile(doc: &Html) -> Result<PopotamoProfileResponse, ScraperError> {
  let root = doc.root_element();

  let scraper_context = scrape_context(root)?;

  let profile = PopotamoProfile {
    user: ShortPopotamoUser {
      server: scraper_context.server,
      id: scrape_id(doc, &scraper_context)?,
      username: scrape_username(doc)?,
    },
    sub_profiles: scrape_sub_profiles(doc)?,
    rank: scrape_rank(doc)?,
    score: scrape_score(doc)?,
    leaderboard: scrape_leaderboard(doc)?,
    ismoderator: scrape_moderator_status(doc)?,
    nb_cups_won: scrape_nb_cup_won(doc)?,
    unique_rewards: scrape_unique_rewards(doc)?,
    creation_date: scrape_creation_date(doc)?,
    personal_infos: scrape_personal_infos(doc)?,
  };

  Ok(PopotamoProfileResponse {
    session_user: scraper_context.session,
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
