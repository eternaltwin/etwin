use std::fs::File;
use std::io::{BufReader, BufWriter};
use std::path::{Path, PathBuf};

use once_cell::sync::Lazy;
use serde::{de::DeserializeOwned, Deserialize, Serialize};

use super::errors::ScraperError;
use super::scraper;
use etwin_core::hammerfest::*;

macro_rules! declare_scraper_tests {
  ($($test_type:ident($test_name:ident);)*) => { $(
    #[test]
    #[allow(non_snake_case)]
    fn $test_name() {
      tests_impl::$test_type(tests_helpers::parse_path_from_fn_name(
        &tests_helpers::RESOURCES_ROOT,
        stringify!($test_name),
      ));
    }
  )* }
}

declare_scraper_tests! {
  base(login__en_guest_default);
  base(login__en_guest_error);
  base(login__es_guest_default);
  base(login__es_guest_error);
  base(login__es_user273549_default);
  base(login__fr_guest_default);
  base(login__fr_guest_error);
  base(home__fr_user127);

  profile(profile__en_user180098_guest);
  profile(profile__en_user180098_user205769);
  profile(profile__en_user183556_user205769);
  profile(profile__en_user205769_user205769);
  profile(profile__en_user209170_00_create_account);
  profile(profile__en_user209170_01_shift_at_lvl_0);
  profile(profile__en_user209170_02_die_at_lvl_0);
  profile(profile__en_user209170_03_coin_and_die_at_lvl_0);
  profile(profile__en_user209170_04_die_at_lvl_1);
  profile(profile__en_user84400_user265769);
  profile(profile__en_user9999999_guest);
  profile(profile__es_user136399_user273549);
  profile(profile__es_user248939_guest);
  profile(profile__es_user44545_guest);
  profile(profile__es_user9999999_guest);
  profile(profile__fr_user1041317_user1041317);
  profile(profile__fr_user127_guest);
  profile(profile__fr_user176431_user176431);
  profile(profile__fr_user9999999_user127);

  inventory(inventory__en_user209170_00_one_coin);
  inventory(inventory__en_user209170_01_coin_and_crystals);
  inventory(inventory__fr_user127);
  inventory(inventory__fr_user1041317);
}

mod tests_helpers {
  use super::*;

  pub static RESOURCES_ROOT: Lazy<PathBuf> = Lazy::new(|| {
    PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap()).join("../../test-resources/scraping/hammerfest")
  });

  // Converts a test function name into a path: `__` becomes `/`, and `_` becomes `-`.
  pub fn parse_path_from_fn_name(root: &Path, name: &str) -> PathBuf {
    let mut path = root.to_owned();
    path.extend(name.split("__").map(|part| part.replace('_', "-")));
    path
  }

  pub fn test_scraper<T, O, F>(mut path: PathBuf, scraper: F)
  where
    T: Serialize + DeserializeOwned + Eq,
    O: DeserializeOwned,
    F: FnOnce(O, &scraper::Html) -> Result<T, ScraperError>,
  {
    path.push("input.html");
    let input = std::fs::read_to_string(&path).unwrap();
    let input = scraper::Html::parse_document(&input);
    path.pop();

    path.push("expected.json");
    let expected: T = serde_json::from_reader(BufReader::new(File::open(&path).unwrap())).unwrap();
    path.pop();

    path.push("options.json");
    let options: O = serde_json::from_reader(BufReader::new(File::open(&path).unwrap())).unwrap();
    path.pop();

    let actual = scraper(options, &input).expect("scraper failed to scrape input");

    if expected != actual {
      path.push("actual.json");
      serde_json::to_writer_pretty(BufWriter::new(File::create(&path).unwrap()), &actual).unwrap();
      path.pop();
      panic!("scraped output was different than expected");
    }
  }
}

mod tests_impl {
  use super::*;

  pub fn base(path: PathBuf) {
    #[derive(Deserialize)]
    struct Options {
      server: HammerfestServer,
    }

    #[derive(Serialize, Deserialize, PartialEq, Eq)]
    struct Output {
      #[serde(rename = "self")]
      this: Option<ShortHammerfestUser>,
      is_error: bool,
    }

    tests_helpers::test_scraper(path, |options: Options, html| {
      Ok(Output {
        this: scraper::scrape_user_base(options.server, html)?,
        is_error: scraper::is_login_page_error(html),
      })
    });
  }

  pub fn profile(path: PathBuf) {
    #[derive(Deserialize)]
    struct Options {
      server: HammerfestServer,
      user_id: HammerfestUserId,
    }

    tests_helpers::test_scraper(path, |options: Options, html| {
      scraper::scrape_user_profile(options.server, options.user_id, html)
    });
  }

  pub fn inventory(path: PathBuf) {
    tests_helpers::test_scraper(path, |_options: (), html| scraper::scrape_user_inventory(html));
  }
}
