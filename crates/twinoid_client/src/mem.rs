use async_trait::async_trait;
use etwin_core::core::HtmlFragment;
use etwin_core::twinoid::api::{User, UserQuery};
use etwin_core::twinoid::{TwinoidApiAuth, TwinoidClient, TwinoidUserDisplayName};
use etwin_core::types::AnyError;

pub struct MemTwinoidClient;

#[async_trait]
impl TwinoidClient for MemTwinoidClient {
  async fn get_me<Query: UserQuery>(&self, _auth: TwinoidApiAuth, _query: &Query) -> Result<Query::Output, AnyError>
  where
    Self: Sized,
  {
    todo!()
  }

  async fn get_me_short(&self, _auth: TwinoidApiAuth) -> Result<User<TwinoidUserDisplayName, HtmlFragment>, AnyError> {
    todo!()
  }
}
