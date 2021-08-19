use async_trait::async_trait;
use etwin_core::core::LocaleId;
use etwin_core::email::{EmailContent, EmailFormatter, VerifyRegistrationEmail};
use etwin_core::types::EtwinError;
use serde::{Deserialize, Serialize};

pub struct JsonEmailFormatter;

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct JsonBody<T> {
  pub locale: LocaleId,
  pub data: T,
}

#[async_trait]
impl EmailFormatter for JsonEmailFormatter {
  async fn verify_registration_email(
    &self,
    locale: LocaleId,
    data: &VerifyRegistrationEmail,
  ) -> Result<EmailContent, EtwinError> {
    let body = serde_json::to_string_pretty(&JsonBody { locale, data })?;
    let body = format!("{}\n", body);
    Ok(EmailContent {
      title: "verifyRegistrationEmail".parse().unwrap(),
      body_text: body.parse().unwrap(),
      body_html: None,
    })
  }
}

#[cfg(test)]
mod test {
  use crate::json::JsonEmailFormatter;
  use etwin_core::core::LocaleId;
  use etwin_core::email::{EmailContent, EmailFormatter, VerifyRegistrationEmail};

  #[tokio::test]
  async fn verify_registration_en() {
    let formatter = JsonEmailFormatter;

    let actual = formatter
      .verify_registration_email(
        LocaleId::EnUs,
        &VerifyRegistrationEmail {
          token: "abcdef".to_string(),
        },
      )
      .await
      .unwrap();

    let expected = EmailContent {
      title: "verifyRegistrationEmail".parse().unwrap(),
      body_text: r#"{
  "locale": "en-US",
  "data": {
    "token": "abcdef"
  }
}
"#
      .parse()
      .unwrap(),
      body_html: None,
    };

    assert_eq!(actual, expected);
  }
  #[tokio::test]
  async fn verify_registration_fr() {
    let formatter = JsonEmailFormatter;

    let actual = formatter
      .verify_registration_email(
        LocaleId::FrFr,
        &VerifyRegistrationEmail {
          token: "abcdef".to_string(),
        },
      )
      .await
      .unwrap();

    let expected = EmailContent {
      title: "verifyRegistrationEmail".parse().unwrap(),
      body_text: r#"{
  "locale": "fr-FR",
  "data": {
    "token": "abcdef"
  }
}
"#
      .parse()
      .unwrap(),
      body_html: None,
    };

    assert_eq!(actual, expected);
  }
}
