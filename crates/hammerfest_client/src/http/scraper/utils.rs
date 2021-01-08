use std::str::FromStr;

use crate::http::errors::ScraperError;
use scraper::{ElementRef, Selector};

pub fn selector_to_string(selector: &Selector) -> String {
  use cssparser::ToCss;
  selector
    .selectors
    .iter()
    .map(|sel| sel.to_css_string())
    .collect::<Vec<_>>()
    .join(", ")
}

pub fn select_one_opt<'a>(node: &ElementRef<'a>, selector: &Selector) -> Result<Option<ElementRef<'a>>, ScraperError> {
  let mut it = node.select(selector);
  match (it.next(), it.next()) {
    (None, _) => Ok(None),
    (Some(first), None) => Ok(Some(first)),
    (Some(_), Some(_)) => Err(ScraperError::TooManyHtmlFragments(selector_to_string(selector))),
  }
}

pub fn select_one<'a>(node: &ElementRef<'a>, selector: &Selector) -> Result<ElementRef<'a>, ScraperError> {
  match select_one_opt(node, selector) {
    Ok(None) => Err(ScraperError::HtmlFragmentNotFound(selector_to_string(selector))),
    Ok(Some(elem)) => Ok(elem),
    Err(err) => Err(err),
  }
}

pub fn get_inner_text<'a>(node: &ElementRef<'a>) -> Result<&'a str, ScraperError> {
  let mut it = node.text();
  match (it.next(), it.next()) {
    (None, _) => Ok(""),
    (Some(text), None) => Ok(text),
    (Some(_), Some(_)) => Err(ScraperError::TooManyHtmlFragments("<inner-text>".into())),
  }
}

fn parse_dotted_number_inner<T: FromStr>(mut s: &str, buf: &mut [u8]) -> Result<Option<T>, T::Err> {
  let (negative, len) = {
    let (negative, buf) = if s.starts_with('-') {
      s = &s[1..];
      let (first, rest) = buf.split_first_mut().expect("expected non-empty buffer");
      *first = b'-';
      (true, rest)
    } else {
      (false, &mut buf[..])
    };
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

pub fn parse_dotted_u32(s: &str) -> Result<u32, ScraperError> {
  match parse_dotted_number_inner(s, &mut [0; 16]) {
    Ok(num) => Ok(num.unwrap_or(0)),
    Err(err) => Err(ScraperError::InvalidInteger(s.to_owned(), err)),
  }
}

pub fn remove_prefix_and_suffix<'a>(s: &'a str, prefix: &str, suffix: &str) -> Option<&'a str> {
  if s.starts_with(prefix) && s.ends_with(suffix) {
    let end = s.len() - suffix.len();
    Some(&s[prefix.len()..end])
  } else {
    None
  }
}
