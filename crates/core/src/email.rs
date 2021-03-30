#[cfg(feature = "sqlx")]
use crate::core::{Instant, Secret};
#[cfg(feature = "sqlx")]
use crate::types::EtwinError;
#[cfg(feature = "sqlx")]
use sqlx::{Postgres, Transaction};

declare_new_string! {
  pub struct EmailAddress(String);
  pub type ParseError = EmailAddressParseError;
  const PATTERN = r"@";
  const SQL_NAME = "email_address";
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
