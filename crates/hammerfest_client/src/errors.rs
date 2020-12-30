use thiserror::Error;

#[derive(Debug, Error)]
#[error("Endpoint unimplemented for {} Hammerfest client: {}", .client, .endpoint)]
pub(crate) struct UnimplementedError {
  client: &'static str,
  endpoint: &'static str,
}

impl UnimplementedError {
  pub fn new(client: &'static str, endpoint: &'static str) -> Self {
    UnimplementedError { client, endpoint }
  }
}
