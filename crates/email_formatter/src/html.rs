use async_trait::async_trait;
use etwin_core::core::LocaleId;
use etwin_core::email::{EmailContent, EmailFormatter, VerifyRegistrationEmail};
use etwin_core::types::AnyError;

pub struct HtmlEmailFormatter;

#[async_trait]
impl EmailFormatter for HtmlEmailFormatter {
  async fn verify_registration_email(
    &self,
    locale: LocaleId,
    data: &VerifyRegistrationEmail,
  ) -> Result<EmailContent, AnyError> {
    let registration_uri = format!(
      "https://eternal-twin.net/register/verified-email?token={}",
      data.token.as_str()
    );
    let content = match locale {
      LocaleId::FrFr => EmailContent {
        title: "Inscription à Eternaltwin".parse().unwrap(),
        body_text: format!(
          "Bienvenue sur Eternaltwin !\nVeuillez cliquez sur le lien suivant pour valider votre inscription : {}\n",
          registration_uri
        )
        .parse()
        .unwrap(),
        body_html: None,
      },
      _ => EmailContent {
        title: "Eternaltwin registration".parse().unwrap(),
        body_text: format!(
          "Welcome to Eternaltwin!\nPlease click on the following link to complete your registration: {}\n",
          registration_uri
        )
        .parse()
        .unwrap(),
        body_html: None,
      },
    };
    Ok(content)
  }
}

#[cfg(feature = "neon")]
impl neon::prelude::Finalize for HtmlEmailFormatter {}

#[cfg(test)]
mod test {
  use crate::html::HtmlEmailFormatter;
  use etwin_core::core::LocaleId;
  use etwin_core::email::{EmailContent, EmailFormatter, VerifyRegistrationEmail};

  #[tokio::test]
  async fn verify_registration_en() {
    let formatter = HtmlEmailFormatter;

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
      title: "Eternaltwin registration".parse().unwrap(),
      body_text: r#"Welcome to Eternaltwin!
Please click on the following link to complete your registration: https://eternal-twin.net/register/verified-email?token=abcdef
"#
      .parse()
      .unwrap(),
      body_html: None,
    };

    assert_eq!(actual, expected);
  }
  #[tokio::test]
  async fn verify_registration_fr() {
    let formatter = HtmlEmailFormatter;

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
      title: "Inscription à Eternaltwin".parse().unwrap(),
      body_text: r#"Bienvenue sur Eternaltwin !
Veuillez cliquez sur le lien suivant pour valider votre inscription : https://eternal-twin.net/register/verified-email?token=abcdef
"#
      .parse()
      .unwrap(),
      body_html: None,
    };

    assert_eq!(actual, expected);
  }
}
