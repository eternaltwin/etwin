use etwin_core::dinorpg::DinorpgServer;
use once_cell::sync::Lazy;

pub struct ScraperLocale {
  // TODO
}

impl ScraperLocale {
  #[allow(unused)]
  pub fn get(server: DinorpgServer) -> &'static Self {
    match server {
      DinorpgServer::DinorpgCom => &SCRAPER_LOCALE_FR,
      DinorpgServer::EsDinorpgCom => &SCRAPER_LOCALE_ES,
      DinorpgServer::EnDinorpgCom => &SCRAPER_LOCALE_EN,
    }
  }
}

#[allow(dead_code)]
static SCRAPER_LOCALE_FR: Lazy<ScraperLocale> = Lazy::new(|| ScraperLocale {});

#[allow(dead_code)]
static SCRAPER_LOCALE_ES: Lazy<ScraperLocale> = Lazy::new(|| ScraperLocale {});

#[allow(dead_code)]
static SCRAPER_LOCALE_EN: Lazy<ScraperLocale> = Lazy::new(|| ScraperLocale {});
