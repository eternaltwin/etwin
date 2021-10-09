use etwin_core::core::Instant;
use etwin_core::user::UserId;
use sqlx::error::BoxDynError;
use sqlx::postgres::{PgTypeInfo, PgValueRef};
use sqlx::Postgres;

#[derive(Debug)]
pub struct ForumRoleGrantBySection {
  pub user_id: UserId,
  pub start_time: Instant,
  pub granted_by: UserId,
}

impl sqlx::Type<Postgres> for ForumRoleGrantBySection {
  fn type_info() -> sqlx::postgres::PgTypeInfo {
    sqlx::postgres::PgTypeInfo::with_name("forum_role_grant_by_section")
  }

  fn compatible(ty: &sqlx::postgres::PgTypeInfo) -> bool {
    *ty == Self::type_info()
  }
}

impl<'r> sqlx::Decode<'r, Postgres> for ForumRoleGrantBySection {
  fn decode(value: PgValueRef<'r>) -> Result<Self, BoxDynError> {
    let mut decoder = sqlx::postgres::types::PgRecordDecoder::new(value)?;

    let user_id = decoder.try_decode::<UserId>()?;
    let start_time = decoder.try_decode::<Instant>()?;
    let granted_by = decoder.try_decode::<UserId>()?;

    Ok(Self {
      user_id,
      start_time,
      granted_by,
    })
  }
}

#[derive(Debug)]
pub struct ForumRoleGrantBySectionArray(Vec<ForumRoleGrantBySection>);

impl ForumRoleGrantBySectionArray {
  pub const fn new(inner: Vec<ForumRoleGrantBySection>) -> Self {
    Self(inner)
  }

  pub fn into_inner(self) -> Vec<ForumRoleGrantBySection> {
    self.0
  }
}

impl sqlx::Type<Postgres> for ForumRoleGrantBySectionArray {
  fn type_info() -> PgTypeInfo {
    PgTypeInfo::with_name("_forum_role_grant_by_section")
  }
}

impl<'r> sqlx::Decode<'r, Postgres> for ForumRoleGrantBySectionArray {
  fn decode(value: PgValueRef<'r>) -> Result<Self, BoxDynError> {
    Ok(Self(Vec::<ForumRoleGrantBySection>::decode(value)?))
  }
}
