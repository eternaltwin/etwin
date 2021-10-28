use async_trait::async_trait;
use auto_impl::auto_impl;
use etwin_core::auth::AuthContext;
use etwin_core::password::Password;
use etwin_core::types::AnyError;
use etwin_core::user::{ShortUser, UserId, Username};

#[cfg(feature = "http")]
pub mod http;
#[cfg(feature = "mem")]
pub mod mem;

pub enum EtwinAuth {
  Guest,
  Session(String),
  Token(String),
  Credentials { username: Username, password: Password },
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait EtwinClient: Send + Sync {
  async fn get_self(&self, auth: &EtwinAuth) -> Result<AuthContext, AnyError>;

  async fn get_user(&self, auth: &EtwinAuth, user_id: UserId) -> Result<ShortUser, AnyError>;
}
