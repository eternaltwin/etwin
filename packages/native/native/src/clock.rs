use crate::clock::system_clock::JsSystemClock;
use crate::clock::virtual_clock::JsVirtualClock;
use crate::neon_helpers::NeonNamespace;
use etwin_core::clock::Clock;
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "systemClock", system_clock::create_namespace)?;
  ns.set_with(cx, "virtualClock", virtual_clock::create_namespace)?;
  ns.set_function(cx, "now", now)?;
  ns.set_function(cx, "nowUnixS", now_unix_s)?;
  ns.set_function(cx, "nowUnixMs", now_unix_ms)?;
  Ok(ns)
}

pub fn get_native_clock<'a, C: Context<'a>>(cx: &mut C, value: Handle<JsValue>) -> NeonResult<Arc<dyn Clock>> {
  match value.downcast::<JsVirtualClock, _>(cx) {
    Ok(clock) => {
      let clock = Arc::clone(&**clock);
      Ok(clock)
    }
    Err(_) => match value.downcast::<JsSystemClock, _>(cx) {
      Ok(clock) => {
        let clock = Arc::clone(&**clock);
        Ok(clock)
      }
      Err(_) => cx.throw_type_error::<_, Arc<dyn Clock>>("JsVirtualClock | JsSystemClock".to_string()),
    },
  }
}

pub fn now(mut cx: FunctionContext) -> JsResult<JsObject> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner: Arc<dyn Clock> = get_native_clock(&mut cx, inner)?;
  let res = inner.now();
  let res: i64 = res.into_chrono().timestamp_millis();
  let res: f64 = res as f64;
  let res = {
    let global = cx.global();
    let date: Handle<JsFunction> = global.get(&mut cx, "Date")?.downcast(&mut cx).unwrap();
    let args = vec![cx.number(res)];
    date.construct(&mut cx, args)?
  };
  Ok(res.upcast())
}

pub fn now_unix_s(mut cx: FunctionContext) -> JsResult<JsNumber> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner: Arc<dyn Clock> = get_native_clock(&mut cx, inner)?;
  let res = inner.now();
  Ok(cx.number(res.into_posix_timestamp() as f64))
}

pub fn now_unix_ms(mut cx: FunctionContext) -> JsResult<JsNumber> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner: Arc<dyn Clock> = get_native_clock(&mut cx, inner)?;
  let res = inner.now();
  Ok(cx.number(res.into_chrono().timestamp_millis() as f64))
}

pub mod system_clock {
  use crate::neon_helpers::NeonNamespace;
  use etwin_core::clock::SystemClock;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsSystemClock = JsBox<Arc<SystemClock>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsSystemClock> {
    let inner: Arc<SystemClock> = Arc::new(SystemClock);
    Ok(cx.boxed(inner))
  }
}

pub mod virtual_clock {
  use crate::neon_helpers::NeonNamespace;
  use etwin_core::clock::VirtualClock;
  use etwin_core::core::Instant;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    ns.set_function(cx, "advanceTo", advance_to)?;
    Ok(ns)
  }

  pub type JsVirtualClock = JsBox<Arc<VirtualClock>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsVirtualClock> {
    let inner: Arc<VirtualClock> = Arc::new(VirtualClock::new(Instant::ymd_hms(2020, 1, 1, 0, 0, 0)));
    Ok(cx.boxed(inner))
  }

  pub fn advance_to(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let inner = cx.argument::<JsVirtualClock>(0)?;
    let time_json = cx.argument::<JsString>(1)?;
    let time: Instant = serde_json::from_str(&time_json.value(&mut cx)).unwrap();
    inner.advance_to(time);
    Ok(cx.undefined())
  }
}
