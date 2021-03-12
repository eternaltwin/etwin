use crate::auth::AuthContext;
use crate::core::UserDot;
use crate::hammerfest::{
  GetHammerfestUserOptions, HammerfestClient, HammerfestGetProfileByIdOptions, HammerfestProfile, HammerfestStore,
  HammerfestUser, HammerfestUserIdRef, StoredHammerfestUser,
};
use crate::link::{EtwinLink, GetLinkOptions, LinkStore, VersionedEtwinLink, VersionedRawLink};
use crate::user::{GetShortUserOptions, ShortUser, UserRef, UserStore};
use std::error::Error;

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
    _acx: AuthContext,
    options: &GetHammerfestUserOptions,
  ) -> Result<Option<HammerfestUser>, Box<dyn Error>> {
    let user: Option<StoredHammerfestUser> = self.hammerfest_store.get_user(options).await?;
    let user: StoredHammerfestUser = match user {
      Some(user) => user,
      None => {
        let profile: Option<HammerfestProfile> = {
          let options = HammerfestGetProfileByIdOptions {
            server: options.server,
            user_id: options.id,
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
          id: user.id,
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
            .get_short_user(&GetShortUserOptions {
              r#ref: UserRef::Id(l.link.user),
              time: options.time,
            })
            .await?
            .unwrap();
          let etwin: ShortUser = self
            .user_store
            .get_short_user(&GetShortUserOptions {
              r#ref: UserRef::Id(l.link.user),
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
