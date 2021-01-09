use async_trait::async_trait;
use etwin_core::clock::Clock;
use etwin_core::core::Instant;
use etwin_core::hammerfest::*;
use std::collections::hash_map::Entry;
use std::collections::{HashMap, HashSet};
use std::ops::Deref;
use std::sync::RwLock;
use thiserror::Error;

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

const SERVER_NAMES: &'static [HammerfestServer] = &[
  HammerfestServer::HammerfestEs,
  HammerfestServer::HammerfestFr,
  HammerfestServer::HfestNet,
];

#[derive(Debug, Error)]
pub enum Error {
  #[error("Invalid credentials")]
  InvalidCredentials,
  #[error("Server not found: {:?}", .0)]
  ServerNotFound(HammerfestServer),
  #[error("Invalid session")]
  InvalidSession,
  #[error("Forum theme not found: {:?}", .0)]
  ForumThemeNotFound(HammerfestForumThemeId),
  #[error("Forum thread not found: {:?}", .0)]
  ForumThreadNotFound(HammerfestForumThreadId),
}

struct InMemoryUser {
  user: ShortHammerfestUser,
  password: HammerfestPassword,
  current_session: Option<HammerfestSessionKey>,
}

struct InMemorySession {
  user_id: HammerfestUserId,
  ctime: Instant,
}

struct InMemoryForumTheme {
  theme: HammerfestForumTheme,
  hidden_by: Option<HammerfestUserId>,
}

impl InMemoryForumTheme {
  fn is_visible_by(&self, user: Option<&HammerfestUserId>) -> bool {
    match (user, self.hidden_by.as_ref()) {
      (_, None) => true,
      (Some(user), Some(hidden_by)) => user == hidden_by,
      _ => false,
    }
  }
}

struct InMemoryForumThread {
  theme_id: HammerfestForumThemeId,
  thread: HammerfestForumThread,
  true_last_message_date: Instant,
  messages: Vec<HammerfestForumPost>,
}

struct InMemoryServer {
  users: HashMap<HammerfestUserId, InMemoryUser>,
  forum_themes: HashMap<HammerfestForumThemeId, InMemoryForumTheme>,
  forum_threads: HashMap<HammerfestForumThreadId, InMemoryForumThread>,
  active_sessions: HashMap<HammerfestSessionKey, InMemorySession>,
}

pub struct MemHammerfestClient<TyClock> {
  servers: HashMap<HammerfestServer, RwLock<InMemoryServer>>,
  clock: TyClock,
}

impl<TyClock> MemHammerfestClient<TyClock> {
  pub fn new(clock: TyClock) -> Self
  where
    TyClock: Clock,
  {
    let mut servers = HashMap::new();
    for server_name in SERVER_NAMES {
      servers.insert(
        *server_name,
        RwLock::new(InMemoryServer {
          users: HashMap::new(),
          forum_themes: HashMap::new(),
          forum_threads: HashMap::new(),
          active_sessions: HashMap::new(),
        }),
      );
    }
    Self { servers, clock }
  }

  pub fn disable_server(&mut self, server: HammerfestServer) {
    self.servers.remove(&server);
  }

  pub fn create_user(
    &self,
    server: HammerfestServer,
    id: HammerfestUserId,
    user: HammerfestUsername,
    password: HammerfestPassword,
  ) {
    let mut s = self
      .get_server(server)
      .expect("Can't add users to disabled server")
      .write()
      .unwrap();
    match s.users.entry(id.clone()) {
      Entry::Occupied(_) => panic!("HammerfestUserId conflict"),
      Entry::Vacant(e) => e.insert(InMemoryUser {
        password,
        current_session: None,
        user: ShortHammerfestUser {
          id,
          server,
          username: user,
        },
      }),
    };
  }

  pub fn create_forum_theme(
    &mut self,
    server: HammerfestServer,
    id: HammerfestForumThemeId,
    name: String,
    description: String,
    hidden_by: Option<HammerfestUserId>,
  ) {
    let s = self
      .get_server_mut(server)
      .expect("Can't add forum themes to disabled server");
    if let Some(user) = &hidden_by {
      if !s.users.contains_key(user) {
        panic!("Unknown user id for hidden_by: {}", user);
      }
    }

    match s.forum_themes.entry(id.clone()) {
      Entry::Occupied(_) => panic!("HammerfestForumThemeId conflict"),
      Entry::Vacant(e) => e.insert(InMemoryForumTheme {
        theme: HammerfestForumTheme {
          short: ShortHammerfestForumTheme { server, id, name },
          description,
        },
        hidden_by,
      }),
    };
  }

  pub fn create_forum_thread(
    &mut self,
    server: HammerfestServer,
    theme: HammerfestForumThemeId,
    id: HammerfestForumThreadId,
    name: String,
    author: HammerfestUserId,
    date: Instant,
    is_closed: bool,
    is_sticky: bool,
    content: String,
  ) {
    let s = self
      .get_server_mut(server)
      .expect("Can't add forum threads to disabled server");
    if !s.forum_themes.contains_key(&theme) {
      panic!("Unknown theme id for forum thread: {:?}", theme);
    }
    let author_user = match s.users.get(&author) {
      Some(author) => author,
      None => panic!("Unknown author user id for forum thread: {:?}", author),
    };

    let forum_date = make_forum_date(date);
    match s.forum_threads.entry(id.clone()) {
      Entry::Occupied(_) => panic!("HammerfestForumThreadId conflict"),
      Entry::Vacant(e) => e.insert(InMemoryForumThread {
        theme_id: theme,
        thread: HammerfestForumThread {
          short: ShortHammerfestForumThread { server, id, name },
          author: author_user.user.clone(),
          is_closed,
          is_sticky,
          last_message_date: forum_date.clone(),
          reply_count: 0,
        },
        true_last_message_date: date,
        messages: vec![HammerfestForumPost {
          id: None,
          ctime: forum_date,
          author: make_forum_author(author_user.user.clone()),
          content,
        }],
      }),
    };
  }

  pub fn create_forum_post(
    &mut self,
    server: HammerfestServer,
    thread: HammerfestForumThreadId,
    author: HammerfestUserId,
    date: Instant,
    content: String,
  ) {
    let s = self
      .get_server_mut(server)
      .expect("Can't add forum posts to disabled server");
    let thread = match s.forum_threads.get_mut(&thread) {
      Some(thread) => thread,
      None => panic!("Unknown thread_id id for forum post: {:?}", thread),
    };
    let author_user = match s.users.get(&author) {
      Some(author) => author,
      None => panic!("Unknown author user id for forum post: {:?}", author),
    };

    if thread.true_last_message_date > date {
      panic!("Post dates aren't ordered in thread");
    }

    let forum_date = make_forum_date(date);

    thread.true_last_message_date = date;
    thread.thread.last_message_date = forum_date.clone();
    thread.thread.reply_count += 1;
    thread.messages.push(HammerfestForumPost {
      id: None,
      author: make_forum_author(author_user.user.clone()),
      ctime: forum_date,
      content,
    });
  }
}

impl<TyClock> MemHammerfestClient<TyClock> {
  fn get_server(&self, server: HammerfestServer) -> Result<&RwLock<InMemoryServer>> {
    self
      .servers
      .get(&server)
      .ok_or_else(|| Error::ServerNotFound(server).into())
  }

  fn get_server_mut(&mut self, server: HammerfestServer) -> Result<&mut InMemoryServer> {
    self
      .servers
      .get_mut(&server)
      .ok_or_else(|| Error::ServerNotFound(server).into())
      .map(|server| server.get_mut().unwrap())
  }

  fn check_session<'a>(&self, session: &'a HammerfestSession) -> Result<&'a HammerfestUserId> {
    let server = self.get_server(session.user.server)?.read().unwrap();
    if let Some(sess) = server.active_sessions.get(&session.key) {
      if sess.user_id == session.user.id {
        return Ok(&session.user.id);
      }
    }
    Err(Error::InvalidSession.into())
  }

  fn check_opt_session<'a>(
    &self,
    session: Option<&'a HammerfestSession>,
    server: HammerfestServer,
  ) -> Option<&'a HammerfestUserId> {
    session
      .filter(|sess| sess.user.server == server)
      .and_then(|sess| self.check_session(sess).ok())
  }
}

fn make_forum_date(date: Instant) -> HammerfestForumDate {
  use chrono::{Datelike, Timelike};
  HammerfestForumDate {
    month: date.month() as u8,
    day: date.day() as u8,
    weekday: date.weekday().number_from_monday() as u8,
    hour: date.hour() as u8,
    minute: date.minute() as u8,
  }
}

fn make_forum_author(user: ShortHammerfestUser) -> HammerfestForumPostAuthor {
  HammerfestForumPostAuthor {
    user,
    role: HammerfestForumRole::None,
    rank: 4,
    has_carrot: false,
  }
}

fn make_session_key() -> HammerfestSessionKey {
  use rand::seq::SliceRandom;

  const CHARS: &[u8] = b"abcdefghijklmnopqrstuvwxyz0123456789";
  let mut rng = rand::thread_rng();

  let key = std::iter::from_fn(|| CHARS.choose(&mut rng).copied())
    .map(char::from)
    .take(26)
    .collect();

  HammerfestSessionKey::try_from_string(key).expect("invalid session key")
}

#[async_trait]
impl<TyClock> HammerfestClient for MemHammerfestClient<TyClock>
where
  TyClock: Clock,
{
  async fn create_session(&self, options: &HammerfestCredentials) -> Result<HammerfestSession> {
    let mut server = self.get_server(options.server)?.write().unwrap();

    let (user, old_session) = server
      .users
      .iter_mut()
      .find_map(|(_, user)| {
        if user.user.username == options.username && user.password == options.password {
          Some((user.user.clone(), user.current_session.take()))
        } else {
          None
        }
      })
      .ok_or(Error::InvalidCredentials)?;
    if let Some(key) = old_session {
      server.active_sessions.remove(&key);
    }

    let key = make_session_key();
    let ctime = self.clock.now();
    server.active_sessions.insert(
      key.clone(),
      InMemorySession {
        user_id: user.id.clone(),
        ctime,
      },
    );

    Ok(HammerfestSession {
      user,
      key,
      ctime,
      atime: ctime,
    })
  }

  async fn test_session(
    &self,
    server_name: HammerfestServer,
    key: &HammerfestSessionKey,
  ) -> Result<Option<HammerfestSession>> {
    let server = self.get_server(server_name)?.read().unwrap();
    let session = match server.active_sessions.get(&key) {
      None => return Ok(None),
      Some(sess) => sess,
    };

    let user = server.users.get(&session.user_id).expect("session without valid user");

    Ok(Some(HammerfestSession {
      key: key.clone(),
      ctime: session.ctime,
      atime: self.clock.now(),
      user: user.user.clone(),
    }))
  }

  async fn get_profile_by_id(
    &self,
    session: Option<&HammerfestSession>,
    options: &HammerfestGetProfileByIdOptions,
  ) -> Result<Option<HammerfestProfile>> {
    let server = self.get_server(options.server)?.read().unwrap();
    let is_self = self
      .check_opt_session(session, options.server)
      .filter(|user_id| **user_id == options.user_id)
      .is_some();

    Ok(server.users.get(&options.user_id).map(|user| HammerfestProfile {
      user: user.user.clone(),
      email: if is_self { Some(None) } else { None },
      rank: 4,
      hall_of_fame: None,
      has_carrot: false,
      best_score: 0,
      best_level: 0,
      season_score: 0,
      items: HashSet::new(),
      quests: HashMap::new(),
    }))
  }

  async fn get_own_items(&self, session: &HammerfestSession) -> Result<HashMap<HammerfestItemId, u32>> {
    self.check_session(session)?;

    let mut map = HashMap::new();
    map.insert("0".parse().unwrap(), 5);
    map.insert("1000".parse().unwrap(), 5);
    Ok(map)
  }

  async fn get_own_god_children(&self, session: &HammerfestSession) -> Result<Vec<HammerfestGodChild>> {
    self.check_session(session)?;
    Ok(Vec::new())
  }

  async fn get_own_shop(&self, session: &HammerfestSession) -> Result<HammerfestShop> {
    self.check_session(session)?;
    Ok(HammerfestShop {
      tokens: 0,
      purchased_tokens: Some(0),
      weekly_tokens: 0,
      has_quest_bonus: false,
    })
  }

  async fn get_forum_themes(
    &self,
    session: Option<&HammerfestSession>,
    server: HammerfestServer,
  ) -> Result<Vec<HammerfestForumTheme>> {
    let user = self.check_opt_session(session, server);

    let mut themes = self
      .get_server(server)?
      .read()
      .unwrap()
      .forum_themes
      .iter()
      .filter(|(_, theme)| theme.is_visible_by(user))
      .map(|(_, theme)| theme.theme.clone())
      .collect::<Vec<_>>();

    themes.sort_by(|a, b| a.short.id.cmp(&b.short.id));
    Ok(themes)
  }

  async fn get_forum_theme_page(
    &self,
    session: Option<&HammerfestSession>,
    server: HammerfestServer,
    theme_id: HammerfestForumThemeId,
    page1: u32,
  ) -> Result<HammerfestForumThemePage> {
    let user = self.check_opt_session(session, server);

    let server = self.get_server(server)?.read().unwrap();
    let theme = server
      .forum_themes
      .get(&theme_id)
      .filter(|theme| theme.is_visible_by(user))
      .ok_or_else(|| Error::ForumThemeNotFound(theme_id.clone()))?;

    let (mut sticky, mut threads) = server
      .forum_threads
      .iter()
      .filter_map(|(_, t)| {
        if t.theme_id == theme_id && (t.thread.is_sticky || page1 <= 1) {
          Some(t)
        } else {
          None
        }
      })
      .partition::<Vec<_>, _>(|t| t.thread.is_sticky);

    sticky.sort_by_key(|t| t.true_last_message_date);
    threads.sort_by_key(|t| t.true_last_message_date);

    Ok(HammerfestForumThemePage {
      theme: theme.theme.short.clone(),
      sticky: sticky.iter().map(|t| t.thread.clone()).collect(),
      threads: HammerfestForumThreadListing {
        page1,
        pages: 1,
        items: threads.iter().map(|t| t.thread.clone()).collect(),
      },
    })
  }

  async fn get_forum_thread_page(
    &self,
    session: Option<&HammerfestSession>,
    server: HammerfestServer,
    thread_id: HammerfestForumThreadId,
    page1: u32,
  ) -> Result<HammerfestForumThreadPage> {
    let user = self.check_opt_session(session, server);
    let server = self.get_server(server)?.read().unwrap();

    let (thread, theme) = server
      .forum_threads
      .get(&thread_id)
      .map(|t| {
        (
          t,
          server
            .forum_themes
            .get(&t.theme_id)
            .expect("thread without valid theme"),
        )
      })
      .filter(|(_, t)| t.is_visible_by(user))
      .ok_or_else(|| Error::ForumThreadNotFound(thread_id))?;

    let messages = if page1 > 1 { thread.messages.clone() } else { Vec::new() };

    Ok(HammerfestForumThreadPage {
      theme: theme.theme.short.clone(),
      thread: thread.thread.short.clone(),
      messages: HammerfestForumPostListing {
        page1,
        pages: 1,
        items: messages,
      },
    })
  }
}

#[cfg(feature = "neon")]
impl<TyClock> neon::prelude::Finalize for MemHammerfestClient<TyClock> where TyClock: Clock {}
