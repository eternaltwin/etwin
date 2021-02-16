use crate::neon_helpers::{resolve_callback_with, NeonNamespace};
use crate::password::scrypt::JsScryptPasswordService;
use etwin_core::password::{Password, PasswordHash, PasswordService};
use neon::borrow::Ref;
use neon::prelude::*;
use std::convert::TryInto;
use std::sync::Arc;
use tokio::task::JoinError;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "scrypt", scrypt::create_namespace)?;
  ns.set_function(cx, "hash", hash)?;
  ns.set_function(cx, "verify", verify)?;
  Ok(ns)
}

pub fn get_native_password<'a, C: Context<'a>>(
  cx: &mut C,
  value: Handle<JsValue>,
) -> NeonResult<Arc<dyn PasswordService>> {
  match value.downcast::<JsScryptPasswordService, _>(cx) {
    Ok(val) => {
      let val = Arc::clone(&**val);
      Ok(val)
    }
    Err(_) => cx.throw_type_error::<_, Arc<dyn PasswordService>>("JsScryptPasswordService".to_string()),
  }
}

pub fn hash(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_password(&mut cx, inner)?;
  let clear_password = cx.argument::<JsBuffer>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let clear_password = Context::borrow(&cx, &clear_password, |clear_password: Ref<BinaryData>| {
    let clear_password: &[u8] = clear_password.as_slice::<u8>();
    clear_password.to_vec()
  });
  let clear_password = Password(clear_password);

  let res = async move { tokio::task::spawn_blocking(move || inner.hash(clear_password)).await };

  resolve_callback_with(
    &mut cx,
    res,
    cb,
    |cx: &mut TaskContext, res: Result<PasswordHash, JoinError>| {
      let res: PasswordHash = res.unwrap();
      let bytes: Vec<u8> = res.0;
      let buffer_len: u32 = bytes
        .len()
        .try_into()
        .expect("AssertionError: Expected hash length < u32::MAX");
      let js_buffer = cx.buffer(buffer_len).expect("Failed to allocate");
      TaskContext::borrow(&cx, &js_buffer, |js_buffer: Ref<BinaryData>| {
        let js_buffer = js_buffer.as_mut_slice::<u8>();
        for (i, x) in bytes.into_iter().enumerate() {
          js_buffer[i] = x;
        }
      });

      Ok(js_buffer.upcast())
    },
  )
}

pub fn verify(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let inner = get_native_password(&mut cx, inner)?;
  let hash = cx.argument::<JsBuffer>(1)?;
  let clear_password = cx.argument::<JsBuffer>(2)?;
  let cb = cx.argument::<JsFunction>(3)?.root(&mut cx);

  let hash = Context::borrow(&cx, &hash, |hash: Ref<BinaryData>| {
    let hash: &[u8] = hash.as_slice::<u8>();
    hash.to_vec()
  });
  let hash = PasswordHash(hash);

  let clear_password = Context::borrow(&cx, &clear_password, |clear_password: Ref<BinaryData>| {
    let clear_password: &[u8] = clear_password.as_slice::<u8>();
    clear_password.to_vec()
  });
  let clear_password = Password(clear_password);

  cx.boolean(true);

  let res = async move { tokio::task::spawn_blocking(move || inner.verify(hash, clear_password)).await };

  resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res: Result<bool, JoinError>| {
    Ok(c.boolean(res.unwrap()).upcast())
  })
}

pub mod scrypt {
  use crate::neon_helpers::NeonNamespace;
  use etwin_password::scrypt::{OsRng, ScryptPasswordService};
  use neon::prelude::*;
  use std::sync::Arc;
  use std::time::Duration;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "withOsRng", with_os_rng)?;
    ns.set_function(cx, "recommendedForTests", recommended_for_tests)?;
    Ok(ns)
  }

  pub type JsScryptPasswordService = JsBox<Arc<ScryptPasswordService<OsRng>>>;

  pub fn with_os_rng(mut cx: FunctionContext) -> JsResult<JsScryptPasswordService> {
    let max_time = cx.argument::<JsNumber>(0)?.value(&mut cx);
    let max_mem_frac = cx.argument::<JsNumber>(1)?.value(&mut cx);
    let max_time = Duration::from_secs_f64(max_time);
    let password = ScryptPasswordService::with_os_rng(max_time, max_mem_frac);
    // let password = async move {
    //   tokio::task::spawn_blocking(||ScryptPasswordService::with_os_rng(max_time, max_mem_frac)).await.unwrap()
    // };
    let inner: Arc<ScryptPasswordService<OsRng>> = Arc::new(password);
    Ok(cx.boxed(inner))
  }

  pub fn recommended_for_tests(mut cx: FunctionContext) -> JsResult<JsScryptPasswordService> {
    let password = ScryptPasswordService::recommended_for_tests();
    let inner: Arc<ScryptPasswordService<OsRng>> = Arc::new(password);
    Ok(cx.boxed(inner))
  }
}
