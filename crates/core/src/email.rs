use crate::core::{HtmlFragment, LocaleId};
#[cfg(feature = "sqlx")]
use crate::core::{Instant, Secret};
use crate::types::EtwinError;
use async_trait::async_trait;
use auto_impl::auto_impl;
#[cfg(feature = "_serde")]
use etwin_serde_tools::{Deserialize, Serialize};
#[cfg(feature = "sqlx")]
use sqlx::{Postgres, Transaction};

declare_new_string! {
  pub struct EmailAddress(String);
  pub type ParseError = EmailAddressParseError;
  const PATTERN = r"@";
  const SQL_NAME = "email_address";
}

declare_new_string! {
  pub struct EmailBody(String);
  pub type ParseError = EmailBodyParseError;
  const PATTERN = r"^(?s:.){0,1000}";
  const SQL_NAME = "email_body";
}

declare_new_string! {
  pub struct EmailTitle(String);
  pub type ParseError = EmailTitleParseError;
  const PATTERN = r"^(?s:.){1,100}$";
  const SQL_NAME = "email_title";
}

// TODO: Move this function to a crate with Postgres helpers
#[cfg(feature = "sqlx")]
pub async fn touch_email_address(
  tx: &mut Transaction<'_, Postgres>,
  secret: &Secret,
  email: &EmailAddress,
  now: Instant,
) -> Result<Vec<u8>, EtwinError> {
  #[derive(Debug, sqlx::FromRow)]
  struct Row {
    email: EmailAddress,
    hash: Vec<u8>,
  }

  let row: Row = sqlx::query_as::<_, Row>(
    r"
      WITH
        input_row(email_address, _hash, created_at) AS (
          VALUES(pgp_sym_encrypt($1::EMAIL_ADDRESS, $2::TEXT)::EMAIL_ADDRESS_HASH, digest($1::EMAIL_ADDRESS, 'sha256')::BYTEA, $3::INSTANT)
        ),
        inserted_row AS (
          INSERT
          INTO email_addresses(email_address, _hash, created_at)
            SELECT * FROM input_row
            ON CONFLICT DO NOTHING
            RETURNING $1::EMAIL_ADDRESS AS email, _hash AS hash
      )
      SELECT email, hash FROM inserted_row
      UNION ALL
      SELECT pgp_sym_decrypt(old.email_address, $2::TEXT), old._hash AS hash FROM email_addresses AS old INNER JOIN input_row USING(_hash);
      ",
  )
    .bind(email)
    .bind(secret.as_str())
    .bind(now)
    .fetch_one(tx)
    .await?;
  // Check for hash collision
  assert_eq!(&row.email, email);
  Ok(row.hash)
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct VerifyRegistrationEmail {
  // TODO: Use `new_string` wrapper
  pub token: String,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct EmailContent {
  pub title: EmailTitle,
  pub body_text: EmailBody,
  pub body_html: Option<HtmlFragment>,
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait EmailFormatter: Send + Sync {
  async fn verify_registration_email(
    &self,
    locale: LocaleId,
    data: &VerifyRegistrationEmail,
  ) -> Result<EmailContent, EtwinError>;
}

#[async_trait]
#[auto_impl(&, Arc)]
pub trait Mailer: Send + Sync {
  async fn send_email(&self, recipient: &EmailAddress, content: &EmailContent) -> Result<(), EtwinError>;
}
