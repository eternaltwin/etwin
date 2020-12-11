use std::error::Error;
use etwin_core::core::{Get, With};
use etwin_core::clock::{VirtualClock, Clock, SystemClock};
use chrono::{Utc, TimeZone};
use std::sync::Arc;
use std::future::Future;
use std::pin::Pin;
use std::marker::PhantomData;
use std::fmt::Debug;
use etwin_core::async_fn::AsyncFnOnce;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

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

async fn with_user_store_async<E, F, R>(use_pg: bool, env: E, f: F) -> R
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
