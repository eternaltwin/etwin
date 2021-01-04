pub trait ApiRef<T>: AsRef<T> + Send + Sync {}

impl<Ref, T> ApiRef<T> for Ref where Ref: AsRef<T> + Send + Sync {}
