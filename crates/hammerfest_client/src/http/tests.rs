use std::fs::File;
use std::io::BufReader;
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
  session(login__en_guest_default);
  session(login__en_guest_error);
  session(login__es_guest_default);
  session(login__es_guest_error);
  session(login__es_user273549_default);
  session(login__fr_guest_default);
  session(login__fr_guest_error);
  session(home__fr_user127);

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

  god_children(godchildren__fr_user176431);
  god_children(godchildren__fr_user997002);

  shop(shop__en_user158159);
  shop(shop__fr_user176431);
  shop(shop__fr_user778923);
  shop(shop__fr_user997002);

  forum_home(forum_home__en_user205769);
  forum_home(forum_home__es_user273549);
  forum_home(forum_home__fr_guest);
  forum_home(forum_home__fr_user127);
  forum_home(forum_home__fr_user176431);

  forum_theme(forum_theme__en_theme3_p89_user205769);
  forum_theme(forum_theme__en_theme3_p90_user205769);
  forum_theme(forum_theme__es_theme2_p1_user273549);
  forum_theme(forum_theme__fr_theme3_p1_user176431);

  forum_thread(forum_thread__es_thread29528_p1_user273549);
  forum_thread(forum_thread__es_thread75243_p1_user273549);
  forum_thread(forum_thread__fr_thread473842_p1_user176431);
  forum_thread(forum_thread__fr_thread486800_p9);
  forum_thread(forum_thread__fr_thread487821_p1);
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

  pub fn test_scraper<T, O, F>(path: PathBuf, scraper: F)
  where
    T: Serialize + DeserializeOwned + Eq + core::fmt::Debug,
    O: DeserializeOwned,
    F: FnOnce(O, &scraper::Html) -> Result<T, ScraperError>,
  {
    let input_path = path.join("input.html");
    let options_path = path.join("options.json");
    let actual_path = path.join("rs.actual.json");
    let expected_path = path.join("expected.json");

    let input = std::fs::read_to_string(&input_path).unwrap();
    let input = scraper::Html::parse_document(&input);

    let options: O = serde_json::from_reader(BufReader::new(File::open(&options_path).unwrap())).unwrap();

    let actual = scraper(options, &input).expect("failed to scrape input");
    let actual_json = serde_json::to_string_pretty(&actual).unwrap();
    ::std::fs::write(actual_path, format!("{}\n", actual_json)).expect("Failed to write actual file");

    let expected: T = serde_json::from_reader(BufReader::new(File::open(&expected_path).unwrap())).unwrap();

    assert_eq!(actual, expected);
  }
}

mod tests_impl {
  use super::*;

  pub fn session(path: PathBuf) {
    #[derive(Deserialize)]
    struct Options {
      server: HammerfestServer,
    }

    #[derive(Serialize, Deserialize, PartialEq, Eq, Debug)]
    struct Output {
      #[serde(rename = "self")]
      this: Option<HammerfestSessionUser>,
      is_error: bool,
    }

    tests_helpers::test_scraper(path, |options: Options, html| {
      Ok(Output {
        this: scraper::scrape_session(html.root_element(), options.server)?,
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

  pub fn god_children(path: PathBuf) {
    #[derive(Deserialize)]
    struct Options {
      server: HammerfestServer,
    }

    tests_helpers::test_scraper(path, |options: Options, html| {
      scraper::scrape_user_god_children(options.server, html)
    });
  }

  pub fn shop(path: PathBuf) {
    tests_helpers::test_scraper(path, |_options: (), html| scraper::scrape_user_shop(html));
  }

  pub fn forum_home(path: PathBuf) {
    #[derive(Deserialize)]
    struct Options {
      server: HammerfestServer,
    }

    tests_helpers::test_scraper(path, |options: Options, html| {
      scraper::scrape_forum_home(options.server, html)
    });
  }

  pub fn forum_theme(path: PathBuf) {
    #[derive(Deserialize)]
    struct Options {
      server: HammerfestServer,
    }

    tests_helpers::test_scraper(path, |options: Options, html| {
      scraper::scrape_forum_theme(options.server, html)
    });
  }

  pub fn forum_thread(path: PathBuf) {
    #[derive(Deserialize)]
    struct Options {
      server: HammerfestServer,
      thread_id: HammerfestForumThreadId,
    }

    tests_helpers::test_scraper(path, |options: Options, html| {
      let mut thread = scraper::scrape_forum_thread(options.server, options.thread_id, html)?;

      // scraper_tools's DOM doesn't maintain the attributes order of HTML elements.
      // This means that the serialized HTML isn't deterministic, so we can't compare it
      // for equality and we have to ignore it.
      // See: https://github.com/causal-agent/scraper/issues/54
      for msg in &mut thread.page.posts.items {
        msg.content.clear();
      }

      Ok(thread)
    });
  }
}
