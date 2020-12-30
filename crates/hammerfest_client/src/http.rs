use async_trait::async_trait;
use etwin_core::hammerfest::*;
use std::collections::HashMap;
use crate::errors::UnimplementedError;

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

pub struct HammerfestClientHttp {
  _dummy: (),
}

impl HammerfestClientHttp {
  pub fn new() -> Self {
    Self { _dummy: () }
  }
}

#[async_trait]
impl HammerfestClient for HammerfestClientHttp {
  async fn create_session(&self, _options: &HammerfestCredentials) -> Result<HammerfestSession> {
    Err(UnimplementedError::new("http", "create_session").into())
  }

  async fn test_session(&self, _server: HammerfestServer, _key: &HammerfestSessionKey) -> Result<Option<HammerfestSession>> {
    Err(UnimplementedError::new("http", "test_session").into())
  }

  async fn get_profile_by_id(&self, _session: Option<&HammerfestSession>, _options: &HammerfestGetProfileByIdOptions) -> Result<Option<HammerfestProfile>> {
    Err(UnimplementedError::new("http", "get_profile_by_id").into())
  }

  async fn get_own_items(&self, _session: &HammerfestSession) -> Result<HashMap<HammerfestItemId, u32>> {
    Err(UnimplementedError::new("http", "get_own_items").into())
  }

  async fn get_own_god_children(&self, _session: &HammerfestSession) -> Result<Vec<HammerfestGodChild>> {
    Err(UnimplementedError::new("http", "get_own_god_children").into())
  }

  async fn get_own_shop(&self, _session: &HammerfestSession) -> Result<HammerfestShop> {
    Err(UnimplementedError::new("http", "get_own_shop").into())
  }

  async fn get_forum_themes(&self, _session: Option<&HammerfestSession>, _server: HammerfestServer) -> Result<Vec<HammerfestForumTheme>> {
    Err(UnimplementedError::new("http", "get_forum_themes").into())
  }

  async fn get_forum_theme_page(&self, _session: Option<&HammerfestSession>, _server: HammerfestServer, _theme_id: HammerfestForumThemeId, _first_page: u32) -> Result<HammerfestForumThemePage> {
    Err(UnimplementedError::new("http", "get_forum_theme_page").into())
  }

  async fn get_forum_thread_page(&self, _session: Option<&HammerfestSession>, _server: HammerfestServer, _thread_id: HammerfestForumThreadId, _first_page: u32) -> Result<HammerfestForumThreadPage> {
    Err(UnimplementedError::new("http", "create_session").into())
  }
}
