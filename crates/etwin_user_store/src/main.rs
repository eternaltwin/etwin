use chrono::{TimeZone, Utc};
use etwin_core::async_fn::AsyncFnOnce;
use etwin_core::clock::{Clock, SystemClock, VirtualClock};
use etwin_core::core::{Get, With};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::error::Error;
use std::fmt::Debug;
use std::future::Future;
use std::marker::PhantomData;
use std::pin::Pin;
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  let t = with_clock_async(true, (), on_clock).await;
  dbg!(t);

  async fn on_clock((env, clock): ((), &dyn Clock)) -> u32 {
    println!("Env: {:?}", env);
    println!("Time: {:?}", clock.now());
    clock.now().timestamp_subsec_micros()
  }

  Ok(())
}

async fn with_clock_async<E, F, R>(use_system: bool, env: E, f: F) -> R
where
  F: for<'a> AsyncFnOnce<(E, &'a dyn Clock), Output = R>,
{
  if use_system {
    f.call_once((env, &SystemClock)).await
  } else {
    let clock = VirtualClock::new(Utc.timestamp(1607531946, 0));
    f.call_once((env, &clock)).await
  }
}

async fn with_user_store_async<E, F, R>(use_system: bool, env: E, f: F) -> R
where
  F: for<'a> AsyncFnOnce<(E, &'a dyn Clock), Output = R>,
{
  if use_system {
    f.call_once((env, &SystemClock)).await
  } else {
    let clock = VirtualClock::new(Utc.timestamp(1607531946, 0));
    f.call_once((env, &clock)).await
  }
}
