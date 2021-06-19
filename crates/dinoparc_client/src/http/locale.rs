use std::collections::HashMap;

use etwin_constants::dinoparc::{LOCATIONS, SKILLS};
use etwin_core::dinoparc::{DinoparcLocationId, DinoparcServer, DinoparcSkill};
use once_cell::sync::Lazy;
use regex::Regex;

pub struct ScraperLocale {
  pub in_tournament_pattern: Regex,
  pub location_names: HashMap<&'static str, DinoparcLocationId>,
  pub skill_names: HashMap<&'static str, DinoparcSkill>,
}

impl ScraperLocale {
  pub fn get(server: DinoparcServer) -> &'static Self {
    match server {
      DinoparcServer::DinoparcCom => &SCRAPER_LOCALE_FR,
      DinoparcServer::SpDinoparcCom => &SCRAPER_LOCALE_ES,
      DinoparcServer::EnDinoparcCom => &SCRAPER_LOCALE_EN,
    }
  }
}

static SCRAPER_LOCALE_FR: Lazy<ScraperLocale> = Lazy::new(|| ScraperLocale {
  in_tournament_pattern: Regex::new(r#"participe actuellement au Tournoi de ce lieu"#).unwrap(),
  location_names: std::array::IntoIter::new(LOCATIONS)
    .map(|l| (l.name_fr, l.id))
    .collect(),
  skill_names: std::array::IntoIter::new(SKILLS)
    .map(|s| (s.name_fr, s.skill))
    .collect(),
});

static SCRAPER_LOCALE_ES: Lazy<ScraperLocale> = Lazy::new(|| ScraperLocale {
  in_tournament_pattern: Regex::new(r#"participa actualmente en el Torneo de este lugar"#).unwrap(),
  location_names: std::array::IntoIter::new(LOCATIONS)
    .map(|l| (l.name_es, l.id))
    .collect(),
  skill_names: std::array::IntoIter::new(SKILLS)
    .map(|s| (s.name_es, s.skill))
    .collect(),
});

static SCRAPER_LOCALE_EN: Lazy<ScraperLocale> = Lazy::new(|| ScraperLocale {
  in_tournament_pattern: Regex::new(r#"is currently participating in the Tournament in this location"#).unwrap(),
  location_names: std::array::IntoIter::new(LOCATIONS)
    .map(|l| (l.name_en, l.id))
    .collect(),
  skill_names: std::array::IntoIter::new(SKILLS)
    .map(|s| (s.name_en, s.skill))
    .collect(),
});
