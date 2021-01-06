use crate::tokio_runtime::spawn_future;
use neon::prelude::*;
use serde::Serialize;
use std::error::Error;
use std::future::Future;

pub trait NeonNamespace {
  fn set_function<'a, C, V>(self, cx: &mut C, name: &str, f: fn(FunctionContext) -> JsResult<V>) -> NeonResult<()>
  where
    C: Context<'a>,
    V: Value;

  fn set_with<'a, C, V, F>(self, cx: &mut C, name: &str, f: F) -> NeonResult<()>
  where
    C: Context<'a>,
    V: Value,
    F: for<'r> FnOnce(&'r mut C) -> JsResult<'a, V>;
}

impl NeonNamespace for Handle<'_, JsObject> {
  fn set_function<'a, C: Context<'a>, V: Value>(
    self,
    cx: &mut C,
    name: &str,
    f: fn(FunctionContext) -> JsResult<V>,
  ) -> NeonResult<()> {
    let f = JsFunction::new(cx, f)?;
    self.set(cx, name, f)?;
    Ok(())
  }

  fn set_with<'a, C, V, F>(self, cx: &mut C, name: &str, f: F) -> NeonResult<()>
  where
    C: Context<'a>,
    V: Value,
    F: for<'r> FnOnce(&'r mut C) -> JsResult<'a, V>,
  {
    let v = f(cx)?;
    self.set(cx, name, v)?;
    Ok(())
  }
}

pub(crate) fn resolve_callback<'a, C: Context<'a>, T: Serialize>(
  cx: &mut C,
  fut: impl Future<Output = Result<T, Box<dyn Error>>> + Send + 'static,
  cb: Root<JsFunction>,
) -> JsResult<'a, JsUndefined> {
  let queue = cx.queue();
  spawn_future(Box::pin(async move {
    let res = fut.await;
    let res = match res {
      Ok(v) => match serde_json::to_string(&v) {
        Ok(v) => Ok(v),
        Err(e) => Err(Box::new(e) as Box<dyn Error>),
      },
      Err(e) => Err(e),
    };
    let res = res.map_err(|e| e.to_string());
    queue.send(move |mut cx| {
      let cb = cb.into_inner(&mut cx);
      let this = cx.null();
      let (err, res): (Handle<JsValue>, Handle<JsValue>) = match res {
        Ok(value) => (cx.null().upcast(), cx.string(value).upcast()),
        Err(e) => (JsError::type_error(&mut cx, e)?.upcast(), cx.null().upcast()),
      };
      let _ = cb.call(&mut cx, this, vec![err, res])?;
      Ok(())
    })
  }));

  Ok(cx.undefined())
}
