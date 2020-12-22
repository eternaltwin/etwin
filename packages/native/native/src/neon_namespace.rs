use neon::prelude::*;

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
