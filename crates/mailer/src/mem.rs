use async_trait::async_trait;
use etwin_core::email::{EmailAddress, EmailContent, Mailer};
use etwin_core::types::EtwinError;
use std::collections::HashMap;
use std::sync::RwLock;

struct MemMailerState {
  inboxes: HashMap<EmailAddress, Vec<EmailContent>>,
}

impl MemMailerState {
  pub fn new() -> Self {
    Self {
      inboxes: HashMap::new(),
    }
  }
}

pub struct MemMailer {
  state: RwLock<MemMailerState>,
}

impl Default for MemMailer {
  fn default() -> Self {
    Self::new()
  }
}

impl MemMailer {
  pub fn new() -> Self {
    Self {
      state: RwLock::new(MemMailerState::new()),
    }
  }

  pub fn create_inbox(&self, address: EmailAddress) {
    let mut state = self.state.write().unwrap();
    state.inboxes.insert(address, Vec::new());
  }

  pub fn read_inbox(&self, address: &EmailAddress) -> Vec<EmailContent> {
    let state = self.state.read().unwrap();
    state.inboxes.get(address).unwrap().clone()
  }
}

#[async_trait]
impl Mailer for MemMailer {
  async fn send_email(&self, recipient: &EmailAddress, content: &EmailContent) -> Result<(), EtwinError> {
    let mut state = self.state.write().unwrap();
    match state.inboxes.get_mut(recipient) {
      None => Err("RecipientNotFound".into()),
      Some(inbox) => {
        inbox.push(content.clone());
        Ok(())
      }
    }
  }
}

#[cfg(feature = "neon")]
impl neon::prelude::Finalize for MemMailer {}

#[cfg(test)]
mod test {
  use crate::mem::MemMailer;
  use etwin_core::email::{EmailAddress, EmailContent, Mailer};

  #[tokio::test]
  async fn verify_registration_en() {
    let mailer = MemMailer::new();

    let alice: EmailAddress = "alice@example.com".parse().unwrap();

    mailer.create_inbox(alice.clone());

    {
      let actual = mailer.read_inbox(&alice);
      let expected = Vec::new();
      assert_eq!(actual, expected);
    }

    mailer
      .send_email(
        &alice,
        &EmailContent {
          title: "Hi".parse().unwrap(),
          body_text: "Hello Alice!\n".parse().unwrap(),
          body_html: None,
        },
      )
      .await
      .unwrap();

    {
      let actual = mailer.read_inbox(&alice);
      let expected = vec![EmailContent {
        title: "Hi".parse().unwrap(),
        body_text: "Hello Alice!\n".parse().unwrap(),
        body_html: None,
      }];
      assert_eq!(actual, expected);
    }

    mailer
      .send_email(
        &alice,
        &EmailContent {
          title: "RE: Hi".parse().unwrap(),
          body_text: "Hello again!\n".parse().unwrap(),
          body_html: None,
        },
      )
      .await
      .unwrap();

    {
      let actual = mailer.read_inbox(&alice);
      let expected = vec![
        EmailContent {
          title: "Hi".parse().unwrap(),
          body_text: "Hello Alice!\n".parse().unwrap(),
          body_html: None,
        },
        EmailContent {
          title: "RE: Hi".parse().unwrap(),
          body_text: "Hello again!\n".parse().unwrap(),
          body_html: None,
        },
      ];
      assert_eq!(actual, expected);
    }
  }
}
