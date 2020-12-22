use chrono::{DateTime, TimeZone, Utc};

///////////////////////////////////////
// library code                      //
///////////////////////////////////////

pub trait Clock {
  fn now(&self) -> DateTime<Utc>;
}

pub struct FakeClock {
  time: DateTime<Utc>,
}

impl FakeClock {
  pub fn new(time: DateTime<Utc>) -> Self {
    Self { time }
  }
}

impl Clock for FakeClock {
  fn now(&self) -> DateTime<Utc> {
    self.time
  }
}

pub struct SystemClock;

impl Clock for SystemClock {
  fn now(&self) -> DateTime<Utc> {
    Utc::now()
  }
}

///////////////////////////////////////
// user code                         //
///////////////////////////////////////

fn print_time<C>(clock: &C) -> ()
where
  C: Clock + ?Sized,
{
  println!("Time: {:?}", clock.now())
}

fn with_system_clock(f: impl FnOnce(&SystemClock) -> ()) -> () {
  f(&SystemClock)
}

fn with_fake_clock(f: impl FnOnce(&FakeClock) -> ()) -> () {
  let clock = FakeClock::new(Utc.timestamp(1607531946, 0));
  f(&clock)
}

fn with_clock(use_system: bool, f: impl FnOnce(&dyn Clock) -> ()) -> () {
  if use_system {
    with_system_clock(|c| f(c))
  } else {
    with_fake_clock(|c| f(c))
  }
}

fn main() {
  with_fake_clock(print_time);
  with_system_clock(print_time);
  with_clock(true, |c| print_time(c));
}
