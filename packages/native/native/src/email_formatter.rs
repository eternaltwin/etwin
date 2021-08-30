use crate::email_formatter::html::JsHtmlEmailFormatter;
use crate::email_formatter::json::JsJsonEmailFormatter;
use crate::neon_helpers::NeonNamespace;
use etwin_core::email::EmailFormatter;
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "html", html::create_namespace)?;
  ns.set_with(cx, "json", json::create_namespace)?;
  Ok(ns)
}

pub fn get_native_email_formatter<'a, C: Context<'a>>(
  cx: &mut C,
  value: Handle<JsValue>,
) -> NeonResult<Arc<dyn EmailFormatter>> {
  match value.downcast::<JsHtmlEmailFormatter, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => match value.downcast::<JsJsonEmailFormatter, _>(cx) {
      Ok(val) => {
        let val = Arc::clone(&**val);
        Ok(val)
      }
      Err(_) => {
        cx.throw_type_error::<_, Arc<dyn EmailFormatter>>("JsMemDinoparcStore | JsJsonEmailFormatter".to_string())
      }
    },
  }
}

pub mod html {
  use crate::neon_helpers::{resolve_callback_with, NeonNamespace};
  use etwin_email_formatter::html::HtmlEmailFormatter;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsHtmlEmailFormatter = JsBox<Arc<HtmlEmailFormatter>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let cb = cx.argument::<JsFunction>(0)?.root(&mut cx);
    let inner: Arc<HtmlEmailFormatter> = Arc::new(HtmlEmailFormatter);
    let res = async move { inner };
    resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res| Ok(c.boxed(res).upcast()))
  }
}

pub mod json {
  use crate::neon_helpers::{resolve_callback_with, NeonNamespace};
  use etwin_email_formatter::json::JsonEmailFormatter;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsJsonEmailFormatter = JsBox<Arc<JsonEmailFormatter>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let cb = cx.argument::<JsFunction>(0)?.root(&mut cx);
    let inner: Arc<JsonEmailFormatter> = Arc::new(JsonEmailFormatter);
    let res = async move { inner };
    resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res| Ok(c.boxed(res).upcast()))
  }
}
