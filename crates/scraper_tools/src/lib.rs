use scraper::ElementRef;
use thiserror::Error;

pub trait ElementRefExt<'a> {
  fn get_opt_text(&self) -> Result<Option<&'a str>, TextNodeExcess>;
  fn get_one_text(&self) -> Result<&'a str, &'static str>;
}

impl<'a> ElementRefExt<'a> for ElementRef<'a> {
  fn get_opt_text(&self) -> Result<Option<&'a str>, TextNodeExcess> {
    get_opt_text(*self)
  }

  fn get_one_text(&self) -> Result<&'a str, &'static str> {
    get_one_text(*self)
  }
}

#[derive(Copy, Clone, Debug, Ord, PartialOrd, Eq, PartialEq, Error)]
#[error("expected at most {} text nodes, but found strictly more", .max_expected)]
pub struct TextNodeExcess {
  pub max_expected: usize,
}

pub fn get_opt_text(node: ElementRef) -> Result<Option<&str>, TextNodeExcess> {
  let mut it = node.text();
  match (it.next(), it.next()) {
    (t, None) => Ok(t),
    (_, Some(_)) => Err(TextNodeExcess { max_expected: 1 }),
  }
}

pub fn get_one_text(node: ElementRef) -> Result<&str, &'static str> {
  let mut it = node.text();
  match (it.next(), it.next()) {
    (None, None) => Err("TooFewTextNodes: expected 1, got 0"),
    (Some(t), None) => Ok(t),
    (_, Some(_)) => Err("TooManyTextNodes: expected 1, got 2 or more"),
  }
}

#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub struct FlashVars<'a>(&'a str);

#[derive(Debug, Clone)]
pub struct FlashVarsIter<'a>(std::iter::Map<std::str::Split<'a, char>, for<'r> fn(&'r str) -> (&'r str, &'r str)>);

impl<'a> FlashVars<'a> {
  pub fn new(r: &'a str) -> Self {
    Self(r)
  }
}

impl<'a> IntoIterator for FlashVars<'a> {
  type Item = (&'a str, &'a str);
  type IntoIter = FlashVarsIter<'a>;

  fn into_iter(self) -> Self::IntoIter {
    FlashVarsIter(self.0.split('&').map(|item| item.split_once('=').unwrap_or((item, ""))))
  }
}

impl<'a> Iterator for FlashVarsIter<'a> {
  type Item = (&'a str, &'a str);

  fn next(&mut self) -> Option<Self::Item> {
    self.0.next()
  }
}

#[macro_export]
macro_rules! selector {
  ($selector:literal $(,)?) => {{
    static SELECTOR: ::once_cell::race::OnceBox<::scraper::Selector> = ::once_cell::race::OnceBox::new();
    SELECTOR.get_or_init(|| match Selector::parse($selector) {
      Ok(selector) => Box::new(selector),
      Err(e) => {
        panic!("invalid selector {:?}: {:?}", $selector, e)
      }
    })
  }};
}
