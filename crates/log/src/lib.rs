use std::fmt::Debug;
use std::sync::Arc;

pub trait Sink<T> {
  fn send(&self, item: T);
}

impl<T, S: ?Sized> Sink<T> for &S
where
  S: Sink<T>,
{
  fn send(&self, item: T) {
    Sink::send(*self, item)
  }
}

pub trait SinkMut<T> {
  fn send(&mut self, item: T);
}

impl<T, S: ?Sized> SinkMut<T> for &mut S
where
  S: SinkMut<T>,
{
  fn send(&mut self, item: T) {
    SinkMut::send(*self, item)
  }
}

impl<T, S: ?Sized> SinkMut<T> for &S
where
  S: Sink<T>,
{
  fn send(&mut self, item: T) {
    Sink::send(*self, item)
  }
}

pub trait SinkOnce<T> {
  fn send(self, item: T);
}

impl<T, S: ?Sized> SinkOnce<T> for &S
where
  S: Sink<T>,
{
  fn send(self, item: T) {
    Sink::send(&self, item)
  }
}

impl<T, S: ?Sized> SinkOnce<T> for &mut S
where
  S: SinkMut<T>,
{
  fn send(mut self, item: T) {
    SinkMut::send(&mut self, item)
  }
}

/// A log target represents a static log location
#[derive(Copy, Clone, Ord, PartialOrd, Eq, PartialEq, Hash, Debug)]
pub struct LogTarget(&'static str);

impl From<&'static str> for LogTarget {
  fn from(target: &'static str) -> Self {
    Self(target)
  }
}

impl From<LogTarget> for &'static str {
  fn from(target: LogTarget) -> Self {
    target.0
  }
}

/// Trait representing a log subscriber
pub trait Logger<T>: Send + Sync {
  fn log(&self, ev: T);

  fn filter<P>(self, predicate: P) -> Filter<P, Self>
  where
    Self: Sized,
    P: Send + Sync + Fn(&T) -> bool,
  {
    Filter::new(self, predicate)
  }

  fn map<S, F>(self, f: F) -> Map<F, Self>
  where
    Self: Sized,
    F: Send + Sync + Fn(S) -> T,
  {
    Map::new(self, f)
  }

  fn filter_map<S, F>(self, f: F) -> FilterMap<F, Self>
  where
    Self: Sized,
    F: Send + Sync + Fn(S) -> Option<T>,
  {
    FilterMap::new(self, f)
  }
}

/// Filter events to keep only those verifying the predicate
pub struct Filter<P, L> {
  logger: L,
  predicate: P,
}

impl<P, L> Filter<P, L> {
  fn new(logger: L, predicate: P) -> Self {
    Self { logger, predicate }
  }
}

impl<T, P, L> Logger<T> for Filter<P, L>
where
  P: Send + Sync + Fn(&T) -> bool,
  L: Logger<T>,
{
  fn log(&self, ev: T) {
    if (&self.predicate)(&ev) {
      self.logger.log(ev);
    }
  }
}

/// Map incoming events to a type compatible with the inner logger
pub struct Map<F, L> {
  logger: L,
  f: F,
}

impl<F, L> Map<F, L> {
  fn new(logger: L, f: F) -> Self {
    Self { logger, f }
  }
}

impl<T, U, F, L> Logger<T> for Map<F, L>
where
  F: Send + Sync + Fn(T) -> U,
  L: Logger<U>,
{
  fn log(&self, ev: T) {
    self.logger.log((self.f)(ev))
  }
}

/// Filter events to keep only thoese verifying a predicate and map to a type
/// compatible with the inner logger.
pub struct FilterMap<F, L> {
  logger: L,
  f: F,
}

impl<F, L> FilterMap<F, L> {
  fn new(logger: L, f: F) -> Self {
    Self { logger, f }
  }
}

impl<T, U, F, L> Logger<T> for FilterMap<F, L>
where
  F: Send + Sync + Fn(T) -> Option<U>,
  L: Logger<U>,
{
  fn log(&self, ev: T) {
    if let Some(ev) = (self.f)(ev) {
      self.logger.log(ev)
    }
  }
}

impl<L, Ev> Logger<Ev> for &L
where
  L: ?Sized + Logger<Ev>,
{
  fn log(&self, ev: Ev) {
    Logger::log(*self, ev)
  }
}

impl<L, Ev> Logger<Ev> for Arc<L>
where
  L: ?Sized + Logger<Ev>,
{
  fn log(&self, ev: Ev) {
    Logger::log(self.as_ref(), ev)
  }
}

/// Trivial logger sink discarding all events
#[derive(Copy, Clone, Ord, PartialOrd, Eq, PartialEq, Hash, Debug)]
pub struct NoopLogger;

impl<Ev> Logger<Ev> for NoopLogger {
  fn log(&self, _ev: Ev) {}
}

/// Logger sink writing to the FS
pub struct StderrLogger;

impl<Ev> Logger<Ev> for StderrLogger
where
  Ev: Debug,
{
  fn log(&self, ev: Ev) {
    eprintln!("{:?}", ev);
  }
}

impl<T> SinkMut<T> for Vec<T> {
  fn send(&mut self, item: T) {
    self.push(item);
  }
}

impl<T> SinkMut<T> for Option<T> {
  fn send(&mut self, item: T) {
    *self = Some(item);
  }
}
