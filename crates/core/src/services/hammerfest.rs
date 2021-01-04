use crate::auth::AuthContext;
use crate::core::UserDot;
use crate::hammerfest::{
  ArchivedHammerfestUser, GetHammerfestUserOptions, HammerfestClient, HammerfestGetProfileByIdOptions,
  HammerfestProfile, HammerfestStore, HammerfestUser, HammerfestUserIdRef, ShortHammerfestUser,
};
use crate::link::{EtwinLink, GetLinkOptions, LinkStore, VersionedEtwinLink, VersionedRawLink};
use crate::user::{GetUserOptions, ShortUser, UserStore};
use std::borrow::Borrow;
use std::error::Error;
use std::ops::Deref;

pub struct HammerfestService<TyHammerfestClient, TyHammerfestStore, TyLinkStore, TyUserStore>
where
  TyHammerfestClient: HammerfestClient,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
{
  hammerfest_client: TyHammerfestClient,
  hammerfest_store: TyHammerfestStore,
  link_store: TyLinkStore,
  user_store: TyUserStore,
}

impl<TyHammerfestClient, TyHammerfestStore, TyLinkStore, TyUserStore>
  HammerfestService<TyHammerfestClient, TyHammerfestStore, TyLinkStore, TyUserStore>
where
  TyHammerfestClient: HammerfestClient,
  TyHammerfestStore: HammerfestStore,
  TyLinkStore: LinkStore,
  TyUserStore: UserStore,
{
  pub fn new(
    hammerfest_client: TyHammerfestClient,
    hammerfest_store: TyHammerfestStore,
    link_store: TyLinkStore,
    user_store: TyUserStore,
  ) -> Self {
    Self {
      hammerfest_client,
      hammerfest_store,
      link_store,
      user_store,
    }
  }

  pub async fn get_user(
    &self,
    acx: AuthContext,
    options: &GetHammerfestUserOptions,
  ) -> Result<Option<HammerfestUser>, Box<dyn Error>> {
    let user: Option<ArchivedHammerfestUser> = self.hammerfest_store.get_user(options).await?;
    let user: ArchivedHammerfestUser = match user {
      Some(user) => user,
      None => {
        let profile: Option<HammerfestProfile> = {
          let options = HammerfestGetProfileByIdOptions {
            server: options.server,
            user_id: options.id.clone(),
          };
          self.hammerfest_client.get_profile_by_id(None, &options).await?
        };
        match profile {
          Some(profile) => {
            let user = profile.user;
            self.hammerfest_store.touch_short_user(&user).await?
          }
          None => return Ok(None),
        }
      }
    };
    let etwin_link: VersionedRawLink<HammerfestUserIdRef> = {
      let options: GetLinkOptions<HammerfestUserIdRef> = GetLinkOptions {
        remote: HammerfestUserIdRef {
          server: user.server,
          id: user.id.clone(),
        },
        time: None,
      };
      self.link_store.get_link_from_hammerfest(&options).await?
    };
    let etwin_link: VersionedEtwinLink = {
      let current = match etwin_link.current {
        None => None,
        Some(l) => {
          let user: ShortUser = self
            .user_store
            .get_user(&GetUserOptions {
              id: l.link.user.id,
              time: options.time,
            })
            .await?
            .unwrap()
            .into();
          let etwin: ShortUser = self
            .user_store
            .get_user(&GetUserOptions {
              id: l.etwin.id,
              time: options.time,
            })
            .await?
            .unwrap()
            .into();
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
    let hf_user = HammerfestUser {
      server: user.server,
      id: user.id,
      username: user.username,
      archived_at: user.archived_at,
      profile: user.profile,
      items: user.items,
      etwin: etwin_link,
    };
    Ok(Some(hf_user))
  }
}
