use std::future::Future;

// https://github.com/rustasync/team/issues/19#issuecomment-515051308
pub trait AsyncFnOnce<A> {
  type Output;
  type Future: Future<Output = Self::Output> + Send;

  fn call_once(self, a: A) -> Self::Future;
}

impl<A, F, Fut> AsyncFnOnce<A> for F
where
  F: FnOnce(A) -> Fut,
  Fut: Future + Send,
{
  type Output = Fut::Output;
  type Future = Fut;

  fn call_once(self, a: A) -> Self::Future {
    self(a)
  }
}
