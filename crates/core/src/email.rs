#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};

#[cfg_attr(feature = "sqlx", derive(sqlx::Type), sqlx(transparent, rename = "email_address"))]
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct EmailAddress(String);
