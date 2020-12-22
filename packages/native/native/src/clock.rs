use crate::neon_namespace::NeonNamespace;
use neon::prelude::*;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "systemClock", system_clock::create_namespace)?;
  Ok(ns)
}

pub mod system_clock {
  use crate::neon_namespace::NeonNamespace;
  use etwin_core::clock::{Clock, SystemClock};
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    ns.set_function(cx, "now", now)?;
    ns.set_function(cx, "nowUnixS", now_unix_s)?;
    ns.set_function(cx, "nowUnixMs", now_unix_ms)?;
    Ok(ns)
  }

  pub type SystemClockBox = Arc<SystemClock>;

  declare_types! {
    pub class JsSystemClock for SystemClockBox {
      init(_cx) {
        Ok(Arc::new(SystemClock))
      }
    }
  }

  pub fn new(mut cx: FunctionContext) -> JsResult<JsSystemClock> {
    let ctr = JsSystemClock::constructor(&mut cx)?;
    let args: Vec<Handle<JsValue>> = vec![];
    let js_box = ctr.construct(&mut cx, args)?;
    Ok(js_box)
  }

  pub fn now(mut cx: FunctionContext) -> JsResult<JsObject> {
    let boxed = cx.argument::<JsSystemClock>(0)?;
    let res = cx.borrow(&boxed, |boxed: neon::borrow::Ref<&mut SystemClockBox>| {
      boxed.now()
    });
    let res: i64 = res.timestamp_millis();
    let res: f64 = res as f64;
    let res = {
      let global = cx.global();
      let date: Handle<JsFunction> = global.get(&mut cx, "Date")?.downcast().unwrap();
      let args = vec![cx.number(res)];
      date.construct(&mut cx, args)?
    };
    Ok(res.upcast())
  }

  pub fn now_unix_s(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let boxed = cx.argument::<JsSystemClock>(0)?;
    let res = cx.borrow(&boxed, |boxed: neon::borrow::Ref<&mut SystemClockBox>| {
      boxed.now()
    });
    Ok(cx.number((res.timestamp_millis() as f64) / 1000f64))
  }

  pub fn now_unix_ms(mut cx: FunctionContext) -> JsResult<JsNumber> {
    let boxed = cx.argument::<JsSystemClock>(0)?;
    let res = cx.borrow(&boxed, |boxed: neon::borrow::Ref<&mut SystemClockBox>| {
      boxed.now()
    });
    Ok(cx.number(res.timestamp_millis() as f64))
  }
}
