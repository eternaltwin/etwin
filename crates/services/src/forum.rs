use etwin_core::auth::AuthContext;
use etwin_core::clock::Clock;
use etwin_core::core::Listing;
use etwin_core::forum::{
  AddModeratorOptions, CreatePostError, CreatePostOptions, CreateThreadOptions, DeleteModeratorOptions,
  DeletePostError, DeletePostOptions, ForumActor, ForumPost, ForumPostListing, ForumPostRevision, ForumRole,
  ForumRoleGrant, ForumSection, ForumSectionListing, ForumSectionMeta, ForumSectionSelf, ForumStore, ForumThread,
  ForumThreadMetaWithSection, GetForumSectionMetaOptions, GetForumSectionOptions, GetThreadOptions,
  LatestForumPostRevisionListing, RawAddModeratorOptions, RawCreatePostOptions, RawCreateThreadsOptions, RawForumActor,
  RawForumSectionMeta, RawForumThreadMeta, RawGetForumThreadMetaOptions, RawGetPostsOptions, RawGetSectionsOptions,
  RawGetThreadsOptions, ShortForumPost, UpsertSystemSectionError, UpsertSystemSectionOptions, UserForumActor,
};
use etwin_core::types::AnyError;
use etwin_core::user::{GetShortUserOptions, ShortUser, UserStore};
use marktwin::emitter::emit_html;
use marktwin::grammar::Grammar;
use std::collections::HashSet;
use std::convert::TryFrom;
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
  #[error("current actor does not have the permission to create a thread in this section")]
  Forbidden,
  #[error("failed to parse provided body")]
  FailedToParseBody,
  #[error("failed to render provided body")]
  FailedToRenderBody,
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
  #[error("thread not found")]
  ThreadNotFound,
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
    acx: &AuthContext,
    options: &CreateThreadOptions,
  ) -> Result<ForumThread, CreateThreadError> {
    let actor: ForumActor = match acx {
      AuthContext::User(user) => ForumActor::UserForumActor(UserForumActor {
        role: None,
        user: user.user.clone(),
      }),
      AuthContext::Guest(_) => return Err(CreateThreadError::Forbidden),
      _ => todo!(),
    };
    let grammar = Grammar {
      admin: false,
      depth: Some(4),
      emphasis: true,
      icons: HashSet::new(),
      links: {
        let mut links = HashSet::new();
        links.insert(String::from("http"));
        links.insert(String::from("https"));
        links
      },
      r#mod: false,
      quote: false,
      spoiler: false,
      strong: true,
      strikethrough: true,
    };
    let body = marktwin::parser::parse(&grammar, options.body.as_str());
    let body =
      marktwin::ast::concrete::Root::try_from(body.syntax()).map_err(|()| CreateThreadError::FailedToParseBody)?;
    let body = {
      let mut bytes: Vec<u8> = Vec::new();
      emit_html(&mut bytes, &body).map_err(|_| CreateThreadError::FailedToRenderBody)?;
      String::from_utf8(bytes).map_err(|_| CreateThreadError::FailedToRenderBody)?
    };
    let thread = self
      .forum_store
      .create_thread(&RawCreateThreadsOptions {
        actor: actor.clone(),
        section: options.section.clone(),
        title: options.title.clone(),
        body_mkt: options.body.clone(),
        body_html: body,
      })
      .await
      .map_err(CreateThreadError::Other)?;

    let section = self
      .forum_store
      .get_section_meta(&GetForumSectionMetaOptions {
        section: thread.section.into(),
      })
      .await
      .map_err(|e| CreateThreadError::Other(Box::new(e)))?;

    // TODO: Assert the author matches the expected actor
    let post_revision = ForumPostRevision {
      id: thread.post_revision.id,
      time: thread.post_revision.time,
      author: actor.clone(),
      content: thread.post_revision.content,
      moderation: thread.post_revision.moderation,
      comment: thread.post_revision.comment,
    };
    // TODO: Assert the author
    let post = ShortForumPost {
      id: thread.post_id,
      ctime: thread.ctime,
      author: actor.clone(),
      revisions: LatestForumPostRevisionListing {
        count: 1,
        last: post_revision,
      },
    };

    Ok(ForumThread {
      id: thread.id,
      key: thread.key,
      title: thread.title,
      ctime: thread.ctime,
      section: ForumSectionMeta {
        id: section.id,
        key: section.key,
        display_name: section.display_name,
        ctime: section.ctime,
        locale: section.locale,
        threads: section.threads,
        this: match acx {
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
        },
      },
      posts: Listing {
        offset: 0,
        limit: 10,
        count: 1,
        items: vec![post],
      },
      is_pinned: false,
      is_locked: false,
    })
  }

  pub async fn create_post(
    &self,
    acx: &AuthContext,
    options: &CreatePostOptions,
  ) -> Result<ForumPost, CreatePostError> {
    let actor: ForumActor = match acx {
      AuthContext::User(user) => ForumActor::UserForumActor(UserForumActor {
        role: None,
        user: user.user.clone(),
      }),
      AuthContext::Guest(_) => return Err(CreatePostError::Forbidden),
      _ => todo!(),
    };
    let grammar = Grammar {
      admin: false,
      depth: Some(4),
      emphasis: true,
      icons: HashSet::new(),
      links: {
        let mut links = HashSet::new();
        links.insert(String::from("http"));
        links.insert(String::from("https"));
        links
      },
      r#mod: false,
      quote: false,
      spoiler: false,
      strong: true,
      strikethrough: true,
    };
    let body = marktwin::parser::parse(&grammar, options.body.as_str());
    let body =
      marktwin::ast::concrete::Root::try_from(body.syntax()).map_err(|()| CreatePostError::FailedToParseBody)?;
    let body = {
      let mut bytes: Vec<u8> = Vec::new();
      emit_html(&mut bytes, &body).map_err(|_| CreatePostError::FailedToRenderBody)?;
      String::from_utf8(bytes).map_err(|_| CreatePostError::FailedToRenderBody)?
    };
    let post = self
      .forum_store
      .create_post(&RawCreatePostOptions {
        actor: actor.clone(),
        thread: options.thread.clone(),
        body_mkt: options.body.clone(),
        body_html: body,
      })
      .await
      .map_err(CreatePostError::Other)?;

    let thread: RawForumThreadMeta = self
      .forum_store
      .get_thread_meta(&RawGetForumThreadMetaOptions {
        thread: post.thread.into(),
      })
      .await
      .map_err(|e| CreatePostError::Other(Box::new(e)))?;

    let section: RawForumSectionMeta = self
      .forum_store
      .get_section_meta(&GetForumSectionMetaOptions {
        section: post.section.into(),
      })
      .await
      .map_err(|e| CreatePostError::Other(Box::new(e)))?;

    let section = ForumSectionMeta {
      id: section.id,
      key: section.key,
      display_name: section.display_name,
      ctime: section.ctime,
      locale: section.locale,
      threads: section.threads,
      this: match acx {
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
      },
    };

    // TODO: Assert the author matches the expected actor
    let post_revision = ForumPostRevision {
      id: post.revision.id,
      time: post.revision.time,
      // TODO: Assert the author matches `post.revision.author`
      author: actor.clone(),
      content: post.revision.content,
      moderation: post.revision.moderation,
      comment: post.revision.comment,
    };

    Ok(ForumPost {
      id: post.id,
      ctime: post.revision.time,
      // TODO: Assert the author matches `post.revision.author`
      author: actor.clone(),
      revisions: LatestForumPostRevisionListing {
        count: 1,
        last: post_revision,
      },
      thread: ForumThreadMetaWithSection {
        id: thread.id,
        key: thread.key,
        title: thread.title,
        ctime: thread.ctime,
        is_pinned: thread.is_pinned,
        is_locked: thread.is_locked,
        posts: thread.posts,
        section,
      },
    })
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
      .get_section_meta(&GetForumSectionMetaOptions {
        section: options.section.clone(),
      })
      .await
      .map_err(|e| GetSectionError::Other(Box::new(e)))?;
    let threads = self
      .forum_store
      .get_threads(&RawGetThreadsOptions {
        section: section_meta.as_ref().into(),
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

  pub async fn get_thread(&self, acx: &AuthContext, options: &GetThreadOptions) -> Result<ForumThread, GetThreadError> {
    let time = self.clock.now();

    let thread_meta: RawForumThreadMeta = self
      .forum_store
      .get_thread_meta(&RawGetForumThreadMetaOptions {
        thread: options.thread.clone(),
      })
      .await
      .map_err(|e| GetThreadError::Other(Box::new(e)))?;
    let posts = self
      .forum_store
      .get_posts(&RawGetPostsOptions {
        thread: thread_meta.as_ref().into(),
        offset: options.post_offset,
        limit: options.post_limit,
      })
      .await
      .map_err(GetThreadError::Other)?;
    let section_meta: RawForumSectionMeta = self
      .forum_store
      .get_section_meta(&GetForumSectionMetaOptions {
        section: thread_meta.section.into(),
      })
      .await
      .map_err(|e| GetThreadError::Other(Box::new(e)))?;

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
        .map_err(GetThreadError::Other)?
        .expect("failed to resolve grantee");
      let granter = self
        .user_store
        .get_short_user(&grant.granted_by.into())
        .await
        .map_err(GetThreadError::Other)?
        .expect("failed to resolve grantee");
      role_grants.push(ForumRoleGrant {
        role: grant.role,
        user: grantee,
        start_time: grant.start_time,
        granted_by: granter,
      });
    }

    let posts = ForumPostListing {
      offset: posts.offset,
      limit: posts.limit,
      count: posts.count,
      items: {
        let mut items: Vec<ShortForumPost> = Vec::new();
        for item in posts.items {
          let last_revision = item.revisions.last;
          let first_author = self
            .user_store
            .get_short_user(
              &(match item.author {
                RawForumActor::UserForumActor(a) => GetShortUserOptions {
                  r#ref: a.user.id.into(),
                  time: Some(time),
                },
                _ => todo!(),
              }),
            )
            .await
            .map_err(GetThreadError::Other)?
            .unwrap();
          let last_author = self
            .user_store
            .get_short_user(
              &(match last_revision.author {
                RawForumActor::UserForumActor(a) => GetShortUserOptions {
                  r#ref: a.user.id.into(),
                  time: Some(time),
                },
                _ => todo!(),
              }),
            )
            .await
            .map_err(GetThreadError::Other)?
            .unwrap();
          items.push(ShortForumPost {
            id: item.id,
            ctime: item.ctime,
            author: ForumActor::UserForumActor(UserForumActor {
              role: None,
              user: first_author,
            }),
            revisions: LatestForumPostRevisionListing {
              count: item.revisions.count,
              last: ForumPostRevision {
                id: last_revision.id,
                time: last_revision.time,
                author: ForumActor::UserForumActor(UserForumActor {
                  role: None,
                  user: last_author,
                }),
                content: last_revision.content,
                moderation: last_revision.moderation,
                comment: last_revision.comment,
              },
            },
          });
        }
        items
      },
    };

    Ok(ForumThread {
      id: thread_meta.id,
      key: thread_meta.key,
      title: thread_meta.title,
      ctime: thread_meta.ctime,
      posts,
      is_pinned: thread_meta.is_pinned,
      is_locked: thread_meta.is_locked,
      section: ForumSectionMeta {
        id: section_meta.id,
        key: section_meta.key,
        display_name: section_meta.display_name,
        ctime: section_meta.ctime,
        locale: section_meta.locale,
        threads: section_meta.threads,
        this: forum_self,
      },
    })
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
