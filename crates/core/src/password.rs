use auto_impl::auto_impl;

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Password(pub Vec<u8>);

impl From<&[u8]> for Password {
  fn from(value: &[u8]) -> Self {
    Self(Vec::from(value))
  }
}

impl From<&str> for Password {
  fn from(value: &str) -> Self {
    Self(Vec::from(value.as_bytes()))
  }
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct PasswordHash(pub Vec<u8>);

impl From<&[u8]> for PasswordHash {
  fn from(value: &[u8]) -> Self {
    Self(Vec::from(value))
  }
}

#[auto_impl(&, Arc)]
pub trait PasswordService: Send + Sync {
  /// Converts a password's clear text into a hash.
  fn hash(&self, clear_text: Password) -> PasswordHash;

  /// Verifies if the hash and password match.
  fn verify(&self, hash: PasswordHash, clear_text: Password) -> bool;
}
