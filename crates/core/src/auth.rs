use crate::user::ShortUser;

pub enum AuthContext {
  Guest,
  User(UserAuthContext),
}

pub struct UserAuthContext {
  pub user: ShortUser,
  pub is_administrator: bool,
}
