use crate::neon_namespace::NeonNamespace;
use neon::prelude::*;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "uuid4Generator", uuid4_generator::create_namespace)?;
  Ok(ns)
}

pub mod uuid4_generator {
  use crate::neon_namespace::NeonNamespace;
  use etwin_core::uuid::{Uuid4Generator, UuidGenerator};
  use neon::prelude::*;
  use neon::declare_types;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    ns.set_function(cx, "next", next)?;
    Ok(ns)
  }

  pub type Uuid4GeneratorBox = Arc<Uuid4Generator>;

  declare_types! {
    pub class JsUuid4Generator for Uuid4GeneratorBox {
      init(_cx) {
        Ok(Arc::new(Uuid4Generator))
      }
    }
  }

  pub fn new(mut cx: FunctionContext) -> JsResult<JsUuid4Generator> {
    let ctr = JsUuid4Generator::constructor(&mut cx)?;
    let args: Vec<Handle<JsValue>> = vec![];
    let js_box = ctr.construct(&mut cx, args)?;
    Ok(js_box)
  }

  pub fn next(mut cx: FunctionContext) -> JsResult<JsString> {
    let boxed = cx.argument::<JsUuid4Generator>(0)?;
    let res = cx.borrow(&boxed, |boxed: neon::borrow::Ref<&mut Uuid4GeneratorBox>| {
      boxed.next()
    });
    Ok(cx.string(res.to_string()))
  }
}
