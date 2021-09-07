use async_trait::async_trait;
use etwin_core::email::{EmailAddress, EmailContent, Mailer};
use etwin_core::types::AnyError;
use lettre::message::header;
use lettre::message::header::Header;
pub use lettre::message::header::HeaderName;
use lettre::message::{Mailbox, MultiPart};
use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};

#[derive(Clone, PartialEq, Debug)]
pub struct RawHeader {
  name: HeaderName,
  value: String,
}

impl RawHeader {
  pub fn new(name: HeaderName, value: String) -> Self {
    Self { name, value }
  }
}

enum KnownHeader {
  From(header::From),
  PmMessageStream(PmMessageStream),
  ReplyTo(header::ReplyTo),
  // ...
}

impl KnownHeader {
  pub fn from_raw(raw: RawHeader) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
    Ok(match raw.name {
      name if name == header::From::name() => KnownHeader::From(header::From::parse(&raw.value)?),
      name if name == PmMessageStream::name() => KnownHeader::PmMessageStream(PmMessageStream::parse(&raw.value)?),
      name if name == header::ReplyTo::name() => KnownHeader::ReplyTo(header::ReplyTo::parse(&raw.value)?),
      _ => return Err("UnknownHeaderName".into()),
    })
  }
}

#[derive(Clone, Ord, PartialOrd, Eq, PartialEq, Debug, Hash)]
struct PmMessageStream(String);

impl Header for PmMessageStream {
  fn name() -> HeaderName {
    HeaderName::new_from_ascii_str("X-PM-Message-Stream")
  }

  fn parse(s: &str) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
    Ok(Self(s.into()))
  }

  fn display(&self) -> String {
    self.0.clone()
  }
}

pub struct SmtpMailerBuilder {
  pub relay: String,
  pub username: String,
  pub password: String,
  pub sender: Mailbox,
  pub headers: Vec<RawHeader>,
}

impl SmtpMailerBuilder {
  pub fn new(relay: String, username: String, password: String, sender: String) -> Self {
    Self {
      relay,
      username,
      password,
      sender: sender.parse().unwrap(),
      headers: Vec::new(),
    }
  }

  pub fn header(&mut self, header: RawHeader) {
    self.headers.push(header);
  }

  pub fn build(self) -> SmtpMailer {
    SmtpMailer::new(
      self.relay.as_str(),
      self.username,
      self.password,
      self.sender,
      self.headers,
    )
  }
}

pub struct SmtpMailer {
  transport: AsyncSmtpTransport<Tokio1Executor>,
  sender: Mailbox,
  headers: Vec<RawHeader>,
}

impl SmtpMailer {
  pub fn builder(relay: String, username: String, password: String, sender: String) -> SmtpMailerBuilder {
    SmtpMailerBuilder::new(relay, username, password, sender)
  }

  pub fn new(relay: &str, username: String, password: String, sender: Mailbox, headers: Vec<RawHeader>) -> Self {
    Self {
      transport: AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(relay)
        .unwrap()
        .credentials(Credentials::new(username, password))
        .build(),
      headers,
      sender,
    }
  }
}

#[async_trait]
impl Mailer for SmtpMailer {
  async fn send_email(&self, recipient: &EmailAddress, content: &EmailContent) -> Result<(), AnyError> {
    let mut email = Message::builder()
      .from(self.sender.clone())
      .reply_to(self.sender.clone())
      .to(recipient.as_str().parse().unwrap());

    for header in self.headers.iter() {
      let header = KnownHeader::from_raw(header.clone())?;
      email = match header {
        KnownHeader::From(header) => email.header(header),
        KnownHeader::PmMessageStream(header) => email.header(header),
        KnownHeader::ReplyTo(header) => email.header(header),
      };
    }

    let email = email.subject(content.title.as_str());

    let email = match content.body_html.as_ref() {
      None => email.body(content.body_text.to_string()).unwrap(),
      Some(body_html) => email
        .multipart(MultiPart::alternative_plain_html(
          content.body_text.to_string(),
          body_html.to_string(),
        ))
        .unwrap(),
    };

    self.transport.send(email).await.unwrap();

    Ok(())
  }
}

#[cfg(feature = "neon")]
impl neon::prelude::Finalize for SmtpMailer {}

#[cfg(test)]
mod test {
  use crate::smtp::{RawHeader, SmtpMailer};
  use etwin_core::email::{EmailAddress, EmailContent, Mailer};
  use lettre::message::header::HeaderName;

  #[tokio::test]
  async fn verify_registration_en() {
    let config = etwin_config::find_config(std::env::current_dir().unwrap()).unwrap();
    let config = match config.mailer {
      Some(config) => config,
      None => {
        eprintln!("Missing SMTP mailer config, skipping test");
        return;
      }
    };

    let mut mailer = SmtpMailer::builder(config.host, config.username, config.password, config.sender);
    if let Some(headers) = config.headers {
      for header in headers.into_iter() {
        mailer.header(RawHeader::new(
          HeaderName::new_from_ascii(header.name).unwrap(),
          header.value,
        ));
      }
    }
    let mailer = mailer.build();

    let alice: EmailAddress = "contact@eternal-twin.net".parse().unwrap();

    mailer
      .send_email(
        &alice,
        &EmailContent {
          title: "Eternaltwin registration".parse().unwrap(),
          body_text: "Hi, complete the registration by going to <https://eternal-twin.net>."
            .parse()
            .unwrap(),
          body_html: Some(
            "Hi, complete the registration by going to <a href=https://eternal-twin.net>Eternaltwin</a>."
              .parse()
              .unwrap(),
          ),
        },
      )
      .await
      .unwrap();
  }
}
