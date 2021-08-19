use crate::core::{FinitePeriod, Instant, PeriodFrom, PeriodLower};
#[cfg(feature = "_serde")]
use etwin_serde_tools::{serialize_instant, Deserialize, Serialize};
use std::collections::BTreeMap;
use std::iter::FromIterator;

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct SnapshotFrom<T> {
  period: PeriodFrom,
  value: T,
}

impl<T> SnapshotFrom<T> {
  pub fn new(start: Instant, value: T) -> Self {
    Self {
      period: (start..).into(),
      value,
    }
  }

  pub fn period(&self) -> PeriodFrom {
    self.period
  }

  pub fn start_time(&self) -> Instant {
    self.period.start
  }

  pub fn value(&self) -> &T {
    &self.value
  }

  pub fn into_value(self) -> T {
    self.value
  }
}

/// Snapshot of foreign data
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct ForeignSnapshot<T> {
  pub period: PeriodLower,
  pub retrieved: ForeignRetrieved,
  pub value: T,
}

impl<T> ForeignSnapshot<T> {
  pub fn period(&self) -> PeriodLower {
    self.period
  }

  pub fn start_time(&self) -> Instant {
    match self.period {
      PeriodLower::From(PeriodFrom { start }) => start,
      PeriodLower::Finite(FinitePeriod { start, .. }) => start,
    }
  }

  pub fn end_time(&self) -> Option<Instant> {
    match self.period {
      PeriodLower::From(_) => None,
      PeriodLower::Finite(FinitePeriod { end, .. }) => Some(end),
    }
  }

  pub fn value_ref(&self) -> &T {
    &self.value
  }

  pub fn map<U, F>(self, f: F) -> ForeignSnapshot<U>
  where
    F: FnOnce(T) -> U,
  {
    ForeignSnapshot {
      period: self.period,
      retrieved: self.retrieved,
      value: f(self.value),
    }
  }

  pub fn as_ref(&self) -> ForeignSnapshot<&T> {
    ForeignSnapshot {
      period: self.period,
      retrieved: self.retrieved,
      value: &self.value,
    }
  }
}

impl<T: Clone> ForeignSnapshot<&T> {
  pub fn cloned(&self) -> ForeignSnapshot<T> {
    ForeignSnapshot {
      period: self.period,
      retrieved: self.retrieved,
      value: (*self.value).clone(),
    }
  }
}

/// Finite subset of instants when foreign data was retrieved
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
pub struct ForeignRetrieved {
  #[cfg_attr(feature = "_serde", serde(serialize_with = "serialize_instant"))]
  pub latest: Instant,
}

#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct Snapshot<T> {
  pub period: PeriodLower,
  pub value: T,
}

impl<T> Snapshot<T> {
  pub fn period(&self) -> PeriodLower {
    self.period
  }

  pub fn start_time(&self) -> Instant {
    match self.period {
      PeriodLower::From(PeriodFrom { start }) => start,
      PeriodLower::Finite(FinitePeriod { start, .. }) => start,
    }
  }

  pub fn end_time(&self) -> Option<Instant> {
    match self.period {
      PeriodLower::From(_) => None,
      PeriodLower::Finite(FinitePeriod { end, .. }) => Some(end),
    }
  }

  pub fn value_ref(&self) -> &T {
    &self.value
  }

  pub fn map<U, F>(self, f: F) -> Snapshot<U>
  where
    F: FnOnce(T) -> U,
  {
    Snapshot {
      period: self.period,
      value: f(self.value),
    }
  }

  pub fn as_ref(&self) -> Snapshot<&T> {
    Snapshot {
      period: self.period,
      value: &self.value,
    }
  }
}

impl<T: Copy> Snapshot<T> {
  pub fn value(&self) -> T {
    self.value
  }
}

/// First-party time-varying data
pub struct Temporal<T> {
  current: SnapshotFrom<T>,
  old: BTreeMap<Instant, T>,
}

impl<T: Eq> Temporal<T> {
  pub fn new(time: Instant, value: T) -> Self {
    Self {
      current: SnapshotFrom::new(time, value),
      old: BTreeMap::new(),
    }
  }

  pub fn at(&self, time: Option<Instant>) -> Option<SnapshotFrom<&T>> {
    let time = time.unwrap_or(self.current.period.start);
    if time >= self.current.start_time() {
      Some(SnapshotFrom::new(self.current.start_time(), &self.current.value))
    } else {
      self
        .old
        .range(..=time)
        .rev()
        .next()
        .map(|(t, v)| SnapshotFrom::new(*t, v))
    }
  }

  pub fn set(&mut self, time: Instant, value: T) {
    assert!(time > self.current.period.start);
    if value != self.current.value {
      let next = SnapshotFrom {
        period: (time..).into(),
        value,
      };
      let prev = core::mem::replace(&mut self.current, next);
      let old = self.old.insert(prev.period.start, prev.value);
      debug_assert!(old.is_none());
    }
  }

  pub fn time(&self) -> Instant {
    self.current.start_time()
  }

  pub fn current_value(&self) -> &T {
    self.current.value()
  }

  pub fn map<B: Eq, F: FnMut(Snapshot<&T>) -> B>(&self, mut f: F) -> Temporal<B> {
    let mut it = self
      .old
      .iter()
      .chain(core::iter::once((&self.current.period.start, &self.current.value)))
      .peekable();

    let mut result: Option<Temporal<B>> = None;

    while let Some((start, v)) = it.next() {
      let end = it.peek().map(|(t, ..)| *t);
      let period = match end {
        Some(end) => PeriodLower::Finite(FinitePeriod {
          start: *start,
          end: *end,
        }),
        None => PeriodLower::From(PeriodFrom { start: *start }),
      };
      let v = f(Snapshot { period, value: v });
      result = match result {
        None => Some(Temporal::new(*start, v)),
        Some(mut r) => {
          r.set(*start, v);
          Some(r)
        }
      }
    }

    result.unwrap()
  }

  pub fn iter(&self) -> impl Iterator<Item = Snapshot<&T>> {
    let mut next: Option<Instant> = None;
    self
      .old
      .iter()
      .chain(core::iter::once((&self.current.period.start, &self.current.value)))
      .rev()
      .map(move |(start, v)| {
        let period = match next {
          Some(end) => PeriodLower::Finite(FinitePeriod { start: *start, end }),
          None => PeriodLower::From(PeriodFrom { start: *start }),
        };
        next = Some(*start);
        Snapshot { period, value: v }
      })
      .rev()
  }

  pub fn into_current_value(self) -> T {
    self.current.into_value()
  }
}

impl<T: Eq> FromIterator<(Instant, T)> for Temporal<T> {
  fn from_iter<Iter: IntoIterator<Item = (Instant, T)>>(iter: Iter) -> Self {
    let mut iter = iter.into_iter();
    let mut cur: (Instant, T) = match iter.next() {
      Some((t, v)) => (t, v),
      None => panic!("Cannot construct Temporal<T> from empty iterator"),
    };
    let mut old: BTreeMap<Instant, T> = BTreeMap::new();
    for new_cur in iter {
      assert!(new_cur.0 > cur.0);
      if new_cur.1 != cur.1 {
        let old_cur = core::mem::replace(&mut cur, new_cur);
        old.insert(old_cur.0, old_cur.1);
      }
    }
    Self {
      current: SnapshotFrom::new(cur.0, cur.1),
      old,
    }
  }
}

/// Temporal for data we don't own (mainly archived values)
#[cfg_attr(feature = "_serde", derive(Serialize, Deserialize))]
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct LatestTemporal<T> {
  pub latest: ForeignSnapshot<T>,
  // old: BTreeMap<Instant, T>,
}

impl<T> LatestTemporal<T> {
  pub fn map<U, F>(self, f: F) -> LatestTemporal<U>
  where
    F: Fn(T) -> U,
  {
    LatestTemporal {
      latest: self.latest.map(f),
    }
  }

  pub fn as_ref(&self) -> LatestTemporal<&T> {
    LatestTemporal {
      latest: self.latest.as_ref(),
    }
  }
}

/// Third-party time-varying data history supporting only direct snapshots
/// (if you need indirect invalidation support, use [CheckedSnapshotLogEvent])
#[derive(Clone, Default, Eq, PartialEq, Debug)]
pub struct SnapshotLog<T> {
  snapshots: BTreeMap<Instant, T>,
}

impl<T> SnapshotLog<T> {
  pub fn new() -> Self {
    Self {
      snapshots: BTreeMap::new(),
    }
  }

  pub fn snapshot(&mut self, t: Instant, val: T) {
    self.snapshots.insert(t, val);
  }
}

impl<T: Eq> SnapshotLog<T> {
  pub fn latest(&self) -> Option<ForeignSnapshot<&T>> {
    let mut res: Option<(Instant, Instant, &T)> = None;
    for (t, ev) in self.snapshots.iter().rev() {
      match (res, ev) {
        (None, v) => res = Some((*t, *t, v)),
        (Some((_, latest, val)), v) if v == val => res = Some((*t, latest, val)),
        _ => break,
      }
    }
    res.map(|(start, latest, value)| ForeignSnapshot {
      period: PeriodLower::unbounded(start),
      retrieved: ForeignRetrieved { latest },
      value,
    })
  }
}

/// Third-party time-varying data history with indirect invalidation support
#[derive(Clone, Default, Eq, PartialEq, Debug)]
pub struct CheckedSnapshotLog<T> {
  events: BTreeMap<Instant, CheckedSnapshotLogEvent<T>>,
}

#[derive(Clone, Eq, PartialEq, Debug)]
enum CheckedSnapshotLogEvent<T> {
  Snapshot(T),
  Invalidate,
}

impl<T> CheckedSnapshotLog<T> {
  pub fn new() -> Self {
    Self {
      events: BTreeMap::new(),
    }
  }

  /// Invalidate the data: we know it is no longer valid but don't know the new
  /// value.
  pub fn invalidate(&mut self, t: Instant) {
    self.events.insert(t, CheckedSnapshotLogEvent::Invalidate);
  }

  pub fn snapshot(&mut self, t: Instant, val: T) {
    self.events.insert(t, CheckedSnapshotLogEvent::Snapshot(val));
  }
}

impl<T: Eq> CheckedSnapshotLog<T> {
  pub fn latest(&self) -> Option<ForeignSnapshot<&T>> {
    let mut end: Option<Instant> = None;
    let mut res: Option<(Instant, Instant, &T)> = None;
    for (t, ev) in self.events.iter().rev() {
      match (res, ev) {
        (None, CheckedSnapshotLogEvent::Invalidate) => end = Some(*t),
        (None, CheckedSnapshotLogEvent::Snapshot(v)) => res = Some((*t, *t, v)),
        (Some((_, latest, val)), CheckedSnapshotLogEvent::Snapshot(v)) if v == val => res = Some((*t, latest, val)),
        _ => break,
      }
    }
    res.map(|(start, latest, value)| ForeignSnapshot {
      period: PeriodLower::new(start, end),
      retrieved: ForeignRetrieved { latest },
      value,
    })
  }
}
