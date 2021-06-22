use etwin_core::auth::AuthContext;
use etwin_core::core::UserDot;
use etwin_core::dinoparc::{
  ArchivedDinoparcDinoz, ArchivedDinoparcUser, DinoparcStore, DinoparcUserIdRef, EtwinDinoparcDinoz, EtwinDinoparcUser,
  GetDinoparcDinozOptions, GetDinoparcUserOptions,
};
use etwin_core::link::{EtwinLink, GetLinkOptions, LinkStore, VersionedEtwinLink, VersionedRawLink};
use etwin_core::user::{GetShortUserOptions, ShortUser, UserRef, UserStore};
use std::error::Error;
use std::sync::Arc;

pub struct DinoparcService<TyDinoparcStore, TyLinkStore, TyUserStore>
where
  TyDinoparcStore: DinoparcStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
{
  dinoparc_store: TyDinoparcStore,
  link_store: TyLinkStore,
  user_store: TyUserStore,
}

pub type DynDinoparcService = DinoparcService<Arc<dyn DinoparcStore>, Arc<dyn LinkStore>, Arc<dyn UserStore>>;

impl<TyDinoparcStore, TyLinkStore, TyUserStore> DinoparcService<TyDinoparcStore, TyLinkStore, TyUserStore>
where
  TyDinoparcStore: DinoparcStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
{
  pub fn new(dinoparc_store: TyDinoparcStore, link_store: TyLinkStore, user_store: TyUserStore) -> Self {
    Self {
      dinoparc_store,
      link_store,
      user_store,
    }
  }

  pub async fn get_user(
    &self,
    _acx: &AuthContext,
    options: &GetDinoparcUserOptions,
  ) -> Result<Option<EtwinDinoparcUser>, Box<dyn Error + Send + Sync + 'static>> {
    let user: Option<ArchivedDinoparcUser> = self.dinoparc_store.get_user(options).await?;
    let user: ArchivedDinoparcUser = match user {
      Some(user) => user,
      None => return Ok(None),
    };
    let etwin_link: VersionedRawLink<DinoparcUserIdRef> = {
      let options: GetLinkOptions<DinoparcUserIdRef> = GetLinkOptions {
        remote: DinoparcUserIdRef {
          server: user.server,
          id: user.id,
        },
        time: None,
      };
      self.link_store.get_link_from_dinoparc(&options).await?
    };
    let etwin_link: VersionedEtwinLink = {
      let current = match etwin_link.current {
        None => None,
        Some(l) => {
          let user: ShortUser = self
            .user_store
            .get_short_user(&GetShortUserOptions {
              r#ref: UserRef::Id(l.link.user),
              time: options.time,
            })
            .await?
            .unwrap();
          let etwin: ShortUser = self
            .user_store
            .get_short_user(&GetShortUserOptions {
              r#ref: UserRef::Id(l.etwin),
              time: options.time,
            })
            .await?
            .unwrap();
          Some(EtwinLink {
            link: UserDot {
              time: l.link.time,
              user,
            },
            unlink: (),
            etwin,
          })
        }
      };
      VersionedEtwinLink { current, old: vec![] }
    };
    let dparc_user = EtwinDinoparcUser {
      server: user.server,
      id: user.id,
      archived_at: user.archived_at,
      username: user.username,
      coins: user.coins,
      dinoz: user.dinoz,
      inventory: user.inventory,
      etwin: etwin_link,
    };
    Ok(Some(dparc_user))
  }

  pub async fn get_dinoz(
    &self,
    _acx: &AuthContext,
    options: &GetDinoparcDinozOptions,
  ) -> Result<Option<EtwinDinoparcDinoz>, Box<dyn Error + Send + Sync + 'static>> {
    let dinoz: Option<ArchivedDinoparcDinoz> = self.dinoparc_store.get_dinoz(options).await?;
    // TODO: Map owner data to include etwin ref
    Ok(dinoz)
  }
}

#[cfg(feature = "neon")]
impl<TyDinoparcStore, TyLinkStore, TyUserStore> neon::prelude::Finalize
  for DinoparcService<TyDinoparcStore, TyLinkStore, TyUserStore>
where
  TyDinoparcStore: DinoparcStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
{
}
