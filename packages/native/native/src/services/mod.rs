use crate::neon_helpers::NeonNamespace;
use neon::prelude::*;

pub mod hammerfest;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "hammerfest", hammerfest::create_namespace)?;
  Ok(ns)
}
