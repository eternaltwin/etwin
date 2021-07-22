use std::{
  collections::{hash_map::Entry, HashMap},
  str::FromStr,
  sync::RwLock,
};

use crate::http::errors::ScraperError;
use once_cell::sync::Lazy;
use scraper::{ElementRef, Selector};

use super::Result;
use std::num::NonZeroU16;

pub struct Selectors {
  selectors: RwLock<HashMap<&'static str, &'static Selector>>,
}

impl Selectors {
  pub fn get() -> &'static Selectors {
    static SELECTORS: Lazy<Selectors> = Lazy::new(|| Selectors {
      selectors: RwLock::new(HashMap::new()),
    });
    &SELECTORS
  }

  pub fn selector(&self, selector: &'static str) -> &'static Selector {
    // Fast path.
    if let Some(sel) = self.selectors.read().unwrap().get(selector) {
      return *sel;
    }

    let sel = Selector::parse(selector).unwrap_or_else(|e| panic!("invalid selector '{}': {:?}", selector, e));

    match self.selectors.write().unwrap().entry(selector) {
      Entry::Occupied(e) => *e.get(),
      Entry::Vacant(e) => {
        // Only a fixed number of selectors will be created, so it's ok to leak here.
        let sel = Box::leak(Box::new(sel));
        e.insert(sel);
        sel
      }
    }
  }

  pub fn select<'a>(&self, node: ElementRef<'a>, selector: &'static str) -> impl Iterator<Item = ElementRef<'a>> {
    node.select(self.selector(selector))
  }

  pub fn select_one_opt<'a>(&self, node: ElementRef<'a>, selector: &'static str) -> Result<Option<ElementRef<'a>>> {
    let mut it = self.select(node, selector);
    match (it.next(), it.next()) {
      (None, _) => Ok(None),
      (Some(first), None) => Ok(Some(first)),
      (Some(_), Some(_)) => Err(ScraperError::TooManyHtmlFragments(selector.to_owned())),
    }
  }

  pub fn select_one<'a>(&self, node: ElementRef<'a>, selector: &'static str) -> Result<ElementRef<'a>> {
    match self.select_one_opt(node, selector) {
      Ok(None) => Err(ScraperError::HtmlFragmentNotFound(selector.to_owned())),
      Ok(Some(elem)) => Ok(elem),
      Err(err) => Err(err),
    }
  }

  // TODO: use const generics for this once they are stable
  pub fn select_two<'a>(&self, node: ElementRef<'a>, selector: &'static str) -> Result<[ElementRef<'a>; 2]> {
    let mut it = self.select(node, selector);
    match (it.next(), it.next(), it.next()) {
      (Some(a), Some(b), None) => Ok([a, b]),
      (_, _, None) => Err(ScraperError::HtmlFragmentNotFound(selector.to_owned())),
      (_, _, Some(_)) => Err(ScraperError::TooManyHtmlFragments(selector.to_owned())),
    }
  }

  // TODO: use const generics for this once they are stable
  pub fn select_five_and_filter<'a>(
    &self,
    node: ElementRef<'a>,
    selector: &'static str,
    mut filter: impl FnMut(ElementRef<'a>) -> bool,
  ) -> Result<[ElementRef<'a>; 5]> {
    let mut it = self.select(node, selector).filter(|e| filter(*e));
    match (it.next(), it.next(), it.next(), it.next(), it.next(), it.next()) {
      (Some(e1), Some(e2), Some(e3), Some(e4), Some(e5), None) => Ok([e1, e2, e3, e4, e5]),
      (_, _, _, _, _, None) => Err(ScraperError::HtmlFragmentNotFound(selector.to_owned())),
      (_, _, _, _, _, Some(_)) => Err(ScraperError::HtmlFragmentNotFound(selector.to_owned())),
    }
  }

  pub fn select_one_attr<'a>(
    &self,
    node: ElementRef<'a>,
    selector: &'static str,
    attr: &'static str,
  ) -> Result<&'a str> {
    match self.select_one(node, selector)?.value().attr(attr) {
      Some(val) => Ok(val),
      None => Err(ScraperError::HtmlFragmentNotFound(format!("{}[{}]", selector, attr))),
    }
  }

  pub fn select_attrs<'a>(
    &self,
    node: ElementRef<'a>,
    selector: &'static str,
    attr: &'static str,
  ) -> impl Iterator<Item = Result<&'a str>> {
    self
      .select(node, selector)
      .map(move |elem| match elem.value().attr(attr) {
        Some(val) => Ok(val),
        None => Err(ScraperError::HtmlFragmentNotFound(format!("{}[{}]", selector, attr))),
      })
  }

  pub fn select_text_following<'a>(&self, node: ElementRef<'a>, selector: &'static str) -> Result<&'a str> {
    if let Some(node) = self.select_one(node, selector)?.next_sibling() {
      if let scraper::Node::Text(text) = node.value() {
        return Ok(&*text.text);
      }
    }
    Err(ScraperError::HtmlFragmentNotFound(format!("{} ::text", selector)))
  }
}

fn parse_dotted_number_inner<T: FromStr>(mut s: &str, buf: &mut [u8]) -> std::result::Result<Option<T>, T::Err> {
  let (negative, len) = {
    let (negative, buf) = if s.starts_with('-') {
      s = &s[1..];
      let (first, rest) = buf.split_first_mut().expect("expected non-empty buffer");
      *first = b'-';
      (true, rest)
    } else {
      (false, &mut *buf)
    };
    // TODO: Enable the lint again once rust-lang/rust-clippy#5253 is fixed
    #[allow(clippy::suspicious_map)]
    let len = s
      .as_bytes()
      .iter()
      .copied()
      .filter(|b| *b != b'.') // Remove dots.
      .skip_while(|b| *b == b'0') // Remove leading zeros.
      .zip(buf.iter_mut())
      .map(|(b, dest)| *dest = b) // Copy into temp buffer.
      .count(); // Get number of digits; if the buffer is full we know we will overflow.
    (negative, len)
  };

  if len == 0 && s.contains('0') {
    Ok(None)
  } else {
    let used = &buf[..(if negative { len + 1 } else { len })];
    std::str::from_utf8(used)
      .expect("failed to convert back to utf8")
      .parse()
      .map(Some)
  }
}

pub fn parse_dotted_u32(s: &str) -> Result<u32> {
  match parse_dotted_number_inner(s, &mut [0; 16]) {
    Ok(num) => Ok(num.unwrap_or(0)),
    Err(err) => Err(ScraperError::InvalidInteger(s.to_owned(), err)),
  }
}

pub fn parse_u32(s: &str) -> Result<u32> {
  s.parse().map_err(|err| ScraperError::InvalidInteger(s.to_owned(), err))
}

pub fn parse_non_zero_u16(s: &str) -> Result<NonZeroU16> {
  s.parse().map_err(|err| ScraperError::InvalidInteger(s.to_owned(), err))
}

pub fn parse_u16(s: &str) -> Result<u16> {
  s.parse().map_err(|err| ScraperError::InvalidInteger(s.to_owned(), err))
}

pub fn parse_u8(s: &str) -> Result<u8> {
  s.parse().map_err(|err| ScraperError::InvalidInteger(s.to_owned(), err))
}
