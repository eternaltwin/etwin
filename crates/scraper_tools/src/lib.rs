use scraper::ElementRef;

pub trait ElementRefExt<'a> {
  fn get_opt_text(&self) -> Result<Option<&'a str>, &'static str>;
  fn get_one_text(&self) -> Result<&'a str, &'static str>;
}

impl<'a> ElementRefExt<'a> for ElementRef<'a> {
  fn get_opt_text(&self) -> Result<Option<&'a str>, &'static str> {
    get_opt_text(*self)
  }

  fn get_one_text(&self) -> Result<&'a str, &'static str> {
    get_one_text(*self)
  }
}

pub fn get_opt_text(node: ElementRef) -> Result<Option<&str>, &'static str> {
  let mut it = node.text();
  match (it.next(), it.next()) {
    (t, None) => Ok(t),
    (_, Some(_)) => Err("TooManyTextNodes: expected 0 or 1, got 2 or more"),
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
