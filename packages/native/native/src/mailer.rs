use crate::mailer::mem::JsMemMailer;
use crate::mailer::smtp::JsSmtpMailer;
use crate::neon_helpers::NeonNamespace;
use etwin_core::email::Mailer;
use neon::prelude::*;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "mem", mem::create_namespace)?;
  ns.set_with(cx, "smtp", smtp::create_namespace)?;
  Ok(ns)
}

pub fn get_native_mailer<'a, C: Context<'a>>(cx: &mut C, value: Handle<JsValue>) -> NeonResult<Arc<dyn Mailer>> {
  match value.downcast::<JsMemMailer, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => match value.downcast::<JsSmtpMailer, _>(cx) {
      Ok(val) => {
        let val = Arc::clone(&**val);
        Ok(val)
      }
      Err(_) => cx.throw_type_error::<_, Arc<dyn Mailer>>("JsMemMailer | JsSmtpMailer".to_string()),
    },
  }
}

pub mod mem {
  use crate::neon_helpers::{resolve_callback_with, NeonNamespace};
  use etwin_mailer::mem::MemMailer;
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsMemMailer = JsBox<Arc<MemMailer>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let cb = cx.argument::<JsFunction>(0)?.root(&mut cx);
    let inner: Arc<MemMailer> = Arc::new(MemMailer::new());
    let res = async move { inner };
    resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res| Ok(c.boxed(res).upcast()))
  }
}

pub mod smtp {
  use crate::neon_helpers::{resolve_callback_with, NeonNamespace};
  use etwin_mailer::smtp::{HeaderName, RawHeader, SmtpMailer};
  use neon::prelude::*;
  use std::sync::Arc;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    Ok(ns)
  }

  pub type JsSmtpMailer = JsBox<Arc<SmtpMailer>>;

  pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let relay = cx.argument::<JsString>(0)?;
    let username = cx.argument::<JsString>(1)?;
    let password = cx.argument::<JsString>(2)?;
    let sender = cx.argument::<JsString>(3)?;
    let headers = cx.argument::<JsArray>(4)?;
    let cb = cx.argument::<JsFunction>(5)?.root(&mut cx);

    let relay = relay.value(&mut cx);
    let username = username.value(&mut cx);
    let password = password.value(&mut cx);
    let sender = sender.value(&mut cx);

    let mut mailer = SmtpMailer::builder(relay, username, password, sender);

    let headers = headers.to_vec(&mut cx)?;
    for header in headers.into_iter() {
      let header = header.downcast_or_throw::<JsObject, _>(&mut cx)?;
      let name = header.get(&mut cx, "name")?;
      let name = name.downcast_or_throw::<JsString, _>(&mut cx)?;
      let name = name.value(&mut cx);
      let value = header.get(&mut cx, "value")?;
      let value = value.downcast_or_throw::<JsString, _>(&mut cx)?;
      let value = value.value(&mut cx);

      mailer.header(RawHeader::new(HeaderName::new_from_ascii(name).unwrap(), value));
    }

    let mailer = mailer.build();
    let mailer = Arc::new(mailer);

    let res = async move { mailer };
    resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res| Ok(c.boxed(res).upcast()))
  }
}
