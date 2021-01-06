use crate::neon_helpers::NeonNamespace;
use neon::prelude::*;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "uuid4Generator", uuid4_generator::create_namespace)?;
  Ok(ns)
}

pub mod uuid4_generator {
  use crate::neon_helpers::NeonNamespace;
  use etwin_core::uuid::{Uuid4Generator, UuidGenerator};
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    ns.set_function(cx, "next", next)?;
    Ok(ns)
  }

  pub type JsUuid4Generator = JsBox<Arc<Uuid4Generator>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsUuid4Generator> {
    let inner: Arc<Uuid4Generator> = Arc::new(Uuid4Generator);
    Ok(cx.boxed(inner))
  }

  pub fn next(mut cx: FunctionContext) -> JsResult<JsString> {
    let boxed = cx.argument::<JsUuid4Generator>(0)?;
    let res = boxed.next();
    Ok(cx.string(res.to_string()))
  }
}
