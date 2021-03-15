use std::collections::{HashMap, HashSet};

use etwin_constants::hammerfest::{PUBLIC_FORUM_THEMES, QUESTS};
use etwin_core::hammerfest::{HammerfestForumThemeId, HammerfestQuestId, HammerfestServer};
use once_cell::sync::Lazy;

pub struct ScraperTexts {
  pub quest_names: HashMap<&'static str, HammerfestQuestId>,
  pub month_names: HashMap<&'static str, u8>,
  pub weekday_names: HashMap<&'static str, u8>,
  pub public_forum_themes: HashSet<HammerfestForumThemeId>,
}

impl ScraperTexts {
  pub fn get(server: HammerfestServer) -> &'static Self {
    match server {
      HammerfestServer::HammerfestFr => &TEXTS_FR,
      HammerfestServer::HammerfestEs => &TEXTS_ES,
      HammerfestServer::HfestNet => &TEXTS_EN,
    }
  }

  fn empty() -> Self {
    ScraperTexts {
      quest_names: HashMap::new(),
      month_names: HashMap::new(),
      weekday_names: HashMap::new(),
      public_forum_themes: HashSet::new(),
    }
  }

  fn quest(mut self, name: &'static str, id: HammerfestQuestId) -> Self {
    self.quest_names.insert(name, id);
    self
  }

  fn month(mut self, name: &'static str, value: u8) -> Self {
    self.month_names.insert(name, value);
    self
  }

  fn weekday(mut self, name: &'static str, value: u8) -> Self {
    self.weekday_names.insert(name, value);
    self
  }

  fn public_forum_theme(mut self, id: HammerfestForumThemeId) -> Self {
    self.public_forum_themes.insert(id);
    self
  }
}

fn add_public_forum_themes(mut texts: ScraperTexts, server: HammerfestServer) -> ScraperTexts {
  for theme in PUBLIC_FORUM_THEMES.iter().filter(|t| t.server == server) {
    texts = texts.public_forum_theme(theme.id);
  }
  texts
}

static TEXTS_FR: Lazy<ScraperTexts> = Lazy::new(|| {
  let mut texts = ScraperTexts::empty()
    .weekday("lundi", 1)
    .weekday("mardi", 2)
    .weekday("mercredi", 3)
    .weekday("jeudi", 4)
    .weekday("vendredi", 5)
    .weekday("samedi", 6)
    .weekday("dimanche", 7)
    .month("janv.", 1)
    .month("janvier", 1)
    .month("févr.", 2)
    .month("février", 2)
    .month("mars", 3)
    .month("avril", 4)
    .month("mai", 5)
    .month("juin", 6)
    .month("juil.", 7)
    .month("juillet", 7)
    .month("août", 8)
    .month("sept.", 9)
    .month("septembre", 9)
    .month("oct.", 10)
    .month("octobre", 10)
    .month("nov.", 11)
    .month("novembre", 11)
    .month("déc.", 12)
    .month("décembre", 12);

  for q in QUESTS.iter() {
    texts = texts.quest(q.title_fr, q.id);
  }

  add_public_forum_themes(texts, HammerfestServer::HammerfestFr)
});

static TEXTS_ES: Lazy<ScraperTexts> = Lazy::new(|| {
  let mut texts = ScraperTexts::empty()
    .weekday("lunes", 1)
    .weekday("martes", 2)
    .weekday("miércoles", 3)
    .weekday("jueves", 4)
    .weekday("viernes", 5)
    .weekday("sábado", 6)
    .weekday("domingo", 7)
    .month("ene", 1)
    .month("enero", 1)
    .month("feb", 2)
    .month("febrero", 2)
    .month("mar", 3)
    .month("marzo", 3)
    .month("abr", 4)
    .month("abril", 4)
    .month("may", 5)
    .month("mayo", 5)
    .month("jun", 6)
    .month("junio", 6)
    .month("jul", 7)
    .month("julio", 7)
    .month("ago", 8)
    .month("agosto", 8)
    .month("sep", 9)
    .month("septiembre", 9)
    .month("oct", 10)
    .month("octubre", 10)
    .month("nov", 11)
    .month("noviembre", 11)
    .month("dic", 12)
    .month("diciembre", 12);

  for q in QUESTS.iter() {
    texts = texts.quest(q.title_es, q.id);
  }

  add_public_forum_themes(texts, HammerfestServer::HammerfestEs)
});

static TEXTS_EN: Lazy<ScraperTexts> = Lazy::new(|| {
  let mut texts = ScraperTexts::empty()
    .weekday("Monday", 1)
    .weekday("Tuesday", 2)
    .weekday("Wednesday", 3)
    .weekday("Thursday", 4)
    .weekday("Friday", 5)
    .weekday("Saturday", 6)
    .weekday("Sunday", 7)
    .month("Jan", 1)
    .month("January", 1)
    .month("Feb", 2)
    .month("February", 2)
    .month("Mar", 3)
    .month("March", 3)
    .month("Apr", 4)
    .month("April", 4)
    .month("May", 5)
    .month("May", 5)
    .month("Jun", 6)
    .month("June", 6)
    .month("Jul", 7)
    .month("July", 7)
    .month("Aug", 8)
    .month("August", 8)
    .month("Sep", 9)
    .month("September", 9)
    .month("Oct", 10)
    .month("October", 10)
    .month("Nov", 11)
    .month("November", 11)
    .month("Dec", 12)
    .month("December", 12);

  for q in QUESTS.iter() {
    texts = texts.quest(q.title_en, q.id);
  }

  add_public_forum_themes(texts, HammerfestServer::HfestNet)
});
