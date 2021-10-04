use etwin_core::auth::AuthContext;
use etwin_core::clock::Clock;
use etwin_core::core::Listing;
use etwin_core::forum::{
  AddModeratorOptions, CreatePostError, CreatePostOptions, CreateThreadOptions, DeleteModeratorOptions,
  DeletePostError, DeletePostOptions, ForumPost, ForumRole, ForumRoleGrant, ForumSection, ForumSectionListing,
  ForumSectionMeta, ForumSectionSelf, ForumStore, ForumThread, GetForumSectionOptions, GetThreadOptions,
  RawAddModeratorOptions, RawForumSectionMeta, RawGetSectionsOptions, RawGetThreadsOptions, UpsertSystemSectionError,
  UpsertSystemSectionOptions,
};
use etwin_core::types::AnyError;
use etwin_core::user::{ShortUser, UserStore};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AddModeratorError {
  #[error("section not found")]
  SectionNotFound,
  #[error("grantee user not found")]
  GranteeNotFound,
  #[error("current actor does not have the permission to add moderators to this section")]
  Forbidden,
  #[error(transparent)]
  Other(AnyError),
}

#[derive(Error, Debug)]
pub enum DeleteModeratorError {
  #[error("section not found")]
  SectionNotFound,
  #[error(transparent)]
  Other(AnyError),
}

#[derive(Error, Debug)]
pub enum CreateThreadError {
  #[error("section not found")]
  SectionNotFound,
  #[error(transparent)]
  Other(AnyError),
}

#[derive(Error, Debug)]
pub enum GetSectionError {
  #[error("section not found")]
  SectionNotFound,
  #[error(transparent)]
  Other(AnyError),
}

#[derive(Error, Debug)]
pub enum GetSectionsError {
  #[error(transparent)]
  Other(AnyError),
}

#[derive(Error, Debug)]
pub enum GetThreadError {
  #[error("section not found")]
  SectionNotFound,
  #[error(transparent)]
  Other(AnyError),
}

pub struct ForumService<TyClock, TyForumStore, TyUserStore>
where
  TyClock: Clock,
  TyForumStore: ForumStore,
  TyUserStore: UserStore,
{
  #[allow(unused)]
  clock: TyClock,
  forum_store: TyForumStore,
  user_store: TyUserStore,
}

impl<TyClock, TyForumStore, TyUserStore> ForumService<TyClock, TyForumStore, TyUserStore>
where
  TyClock: Clock,
  TyForumStore: ForumStore,
  TyUserStore: UserStore,
{
  #[allow(clippy::too_many_arguments)]
  pub fn new(clock: TyClock, forum_store: TyForumStore, user_store: TyUserStore) -> Self {
    Self {
      clock,
      forum_store,
      user_store,
    }
  }

  pub async fn add_moderator(
    &self,
    acx: &AuthContext,
    options: &AddModeratorOptions,
  ) -> Result<ForumSection, AddModeratorError> {
    let granter = match acx {
      AuthContext::User(acx) if acx.is_administrator => &acx.user,
      _ => return Err(AddModeratorError::Forbidden),
    };

    let grantee = self
      .user_store
      .get_short_user(&options.user.clone().into())
      .await
      .map_err(AddModeratorError::Other)?;
    let grantee: ShortUser = grantee.ok_or(AddModeratorError::GranteeNotFound)?;

    self
      .forum_store
      .add_moderator(&RawAddModeratorOptions {
        section: options.section.clone(),
        grantee: grantee.as_ref(),
        granter: granter.as_ref(),
      })
      .await
      .map_err(AddModeratorError::Other)?;
    let section = self
      .get_section(
        acx,
        &GetForumSectionOptions {
          section: options.section.clone(),
          thread_offset: 0,
          thread_limit: 10,
        },
      )
      .await
      .map_err(|e| AddModeratorError::Other(Box::new(e)))?;
    Ok(section)
  }

  pub async fn delete_moderator(
    &self,
    _acx: &AuthContext,
    _options: &DeleteModeratorOptions,
  ) -> Result<ForumSection, DeleteModeratorError> {
    todo!()
  }

  pub async fn create_thread(
    &self,
    _acx: &AuthContext,
    _options: &CreateThreadOptions,
  ) -> Result<ForumThread, CreateThreadError> {
    todo!()
  }

  pub async fn create_post(
    &self,
    _acx: &AuthContext,
    _options: &CreatePostOptions,
  ) -> Result<ForumPost, CreatePostError> {
    todo!()
  }

  pub async fn delete_post(
    &self,
    _acx: &AuthContext,
    _options: &DeletePostOptions,
  ) -> Result<ForumPost, DeletePostError> {
    todo!()
  }

  pub async fn get_sections(&self, acx: &AuthContext) -> Result<ForumSectionListing, GetSectionsError> {
    let sections: Listing<RawForumSectionMeta> = self
      .forum_store
      .get_sections(&RawGetSectionsOptions { offset: 0, limit: 20 })
      .await
      .map_err(GetSectionsError::Other)?;
    let mut items: Vec<ForumSectionMeta> = Vec::new();
    for section in sections.items.into_iter() {
      let forum_self = match acx {
        AuthContext::User(acx) => {
          let mut roles = Vec::new();
          if acx.is_administrator {
            roles.push(ForumRole::Administrator);
          }
          if section
            .role_grants
            .iter()
            .any(|grant| grant.role == ForumRole::Moderator && grant.user.id == acx.user.id)
          {
            roles.push(ForumRole::Moderator);
          }
          ForumSectionSelf { roles }
        }
        _ => ForumSectionSelf { roles: vec![] },
      };
      let section = ForumSectionMeta {
        id: section.id,
        key: section.key,
        display_name: section.display_name,
        ctime: section.ctime,
        locale: section.locale,
        threads: section.threads,
        this: forum_self,
      };
      items.push(section);
    }
    Ok(Listing {
      offset: sections.offset,
      limit: sections.limit,
      count: sections.count,
      items,
    })
  }

  pub async fn upsert_system_section(
    &self,
    options: &UpsertSystemSectionOptions,
  ) -> Result<ForumSection, UpsertSystemSectionError> {
    self.forum_store.upsert_system_section(options).await
  }

  pub async fn get_section(
    &self,
    acx: &AuthContext,
    options: &GetForumSectionOptions,
  ) -> Result<ForumSection, GetSectionError> {
    let section_meta: RawForumSectionMeta = self
      .forum_store
      .get_section_meta(options)
      .await
      .map_err(|e| GetSectionError::Other(Box::new(e)))?;
    let threads = self
      .forum_store
      .get_threads(&RawGetThreadsOptions {
        section: section_meta.as_ref(),
        offset: options.thread_offset,
        limit: options.thread_limit,
      })
      .await
      .map_err(GetSectionError::Other)?;

    let forum_self = match acx {
      AuthContext::User(acx) => {
        let mut roles = Vec::new();
        if acx.is_administrator {
          roles.push(ForumRole::Administrator);
        }
        if section_meta
          .role_grants
          .iter()
          .any(|grant| grant.role == ForumRole::Moderator && grant.user.id == acx.user.id)
        {
          roles.push(ForumRole::Moderator);
        }
        ForumSectionSelf { roles }
      }
      _ => ForumSectionSelf { roles: vec![] },
    };

    let mut role_grants: Vec<ForumRoleGrant> = Vec::new();
    for grant in section_meta.role_grants.into_iter() {
      let grantee = self
        .user_store
        .get_short_user(&grant.user.into())
        .await
        .map_err(GetSectionError::Other)?
        .expect("failed to resolve grantee");
      let granter = self
        .user_store
        .get_short_user(&grant.granted_by.into())
        .await
        .map_err(GetSectionError::Other)?
        .expect("failed to resolve grantee");
      role_grants.push(ForumRoleGrant {
        role: grant.role,
        user: grantee,
        start_time: grant.start_time,
        granted_by: granter,
      });
    }

    Ok(ForumSection {
      id: section_meta.id,
      key: section_meta.key,
      display_name: section_meta.display_name,
      ctime: section_meta.ctime,
      locale: section_meta.locale,
      threads,
      role_grants,
      this: forum_self,
    })
  }

  pub async fn get_thread(
    &self,
    _acx: &AuthContext,
    _options: &GetThreadOptions,
  ) -> Result<ForumSection, GetThreadError> {
    todo!()
  }
}

#[cfg(feature = "neon")]
impl<TyClock, TyForumStore, TyUserStore> neon::prelude::Finalize for ForumService<TyClock, TyForumStore, TyUserStore>
where
  TyClock: Clock,
  TyForumStore: ForumStore,
  TyUserStore: UserStore,
{
}
