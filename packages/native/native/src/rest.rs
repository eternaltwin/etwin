use crate::neon_helpers::{resolve_callback_with, NeonNamespace};
use crate::services::hammerfest::get_native_hammerfest_service;
use etwin_rest::{create_rest_filter, RestFilter, RouterApi};
use etwin_services::hammerfest::DynHammerfestService;
use neon::borrow::Ref;
use neon::prelude::*;
use std::convert::{TryFrom, TryInto};
use std::ops::Deref;
use std::sync::Arc;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_function(cx, "new", new)?;
  ns.set_function(cx, "handle", handle)?;
  Ok(ns)
}

pub struct HttpRequest {
  method: String,
  path: String,
  headers: Vec<(String, String)>,
  body: Vec<u8>,
}

impl HttpRequest {
  pub fn from_js<'a, C: Context<'a>>(cx: &mut C, value: Handle<JsValue>) -> NeonResult<Self> {
    let value: Handle<JsObject> = value.downcast(cx).or_throw(cx)?;
    let method = value.get(cx, "method")?;
    let path = value.get(cx, "path")?;
    let headers = value.get(cx, "headers")?;
    let body = value.get(cx, "body")?;

    let method: Handle<JsString> = method.downcast(cx).or_throw(cx)?;
    let path: Handle<JsString> = path.downcast(cx).or_throw(cx)?;
    let headers: Handle<JsArray> = headers.downcast(cx).or_throw(cx)?;
    let body: Handle<JsBuffer> = body.downcast(cx).or_throw(cx)?;

    let method = method.value(cx);
    let path = path.value(cx);
    let headers = {
      let mut res: Vec<(String, String)> = Vec::new();
      for header in headers.to_vec(cx)?.into_iter() {
        let header: Handle<JsObject> = header.downcast(cx).or_throw(cx)?;
        let key = header.get(cx, "key")?;
        let value = header.get(cx, "value")?;
        let key: Handle<JsString> = key.downcast(cx).or_throw(cx)?;
        let value: Handle<JsString> = value.downcast(cx).or_throw(cx)?;
        let key = key.value(cx);
        let value = value.value(cx);
        res.push((key, value));
      }
      res
    };
    let body = Context::borrow(cx, &body, |b: Ref<BinaryData>| {
      let b: &[u8] = b.as_slice::<u8>();
      b.to_vec()
    });

    Ok(Self {
      method,
      path,
      headers,
      body,
    })
  }

  pub fn to_warp(&self) -> warp::test::RequestBuilder {
    let mut req = warp::test::request();
    req = req.method(&self.method).path(&self.path);
    for (k, v) in self.headers.iter() {
      req = req.header(k, v);
    }
    req = req.body(&self.body);
    req
  }
}

pub struct HttpResponse(warp::http::Response<warp::hyper::body::Bytes>);

impl HttpResponse {
  pub fn to_js<'a, C: Context<'a>>(&self, cx: &mut C) -> JsResult<'a, JsObject> {
    let res = cx.empty_object();
    let status = self.0.status().as_u16();

    let status = cx.number(status);
    let headers = {
      let warp_headers = self.0.headers();
      let headers_len: u32 = warp_headers.len().try_into().expect("ResponseHeaderMapOverflow");
      let headers: Handle<JsArray> = JsArray::new(cx, headers_len);
      for (i, (name, value)) in warp_headers.iter().enumerate() {
        let header: Handle<JsObject> = cx.empty_object();
        let name = cx.string(name.to_string());
        let value = cx.string(value.to_str().expect("NonStringHeaderValue"));
        header.set(cx, "key", name)?;
        header.set(cx, "value", value)?;
        headers.set(cx, u32::try_from(i).unwrap(), header)?;
      }
      headers
    };
    let body = {
      let warp_body = self.0.body();
      let body_len: u32 = warp_body.len().try_into().expect("ResponseBodyOverflow");
      let body = cx.buffer(body_len)?;
      cx.borrow(&body, |body: Ref<BinaryData>| {
        let body = body.as_mut_slice::<u8>();
        for (i, x) in warp_body.iter().enumerate() {
          body[i] = *x;
        }
      });
      body
    };

    res.set(cx, "status", status)?;
    res.set(cx, "headers", headers)?;
    res.set(cx, "body", body)?;
    Ok(res)
  }
}

#[derive(Clone)]
pub struct RestFilterHandle(RestFilter);

impl RestFilterHandle {
  pub const fn new(inner: RestFilter) -> Self {
    Self(inner)
  }
}

impl Deref for RestFilterHandle {
  type Target = RestFilter;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl Finalize for RestFilterHandle {}

pub type JsRestFilter = JsBox<RestFilterHandle>;

pub fn get_native_rest<'a, C: Context<'a>>(cx: &mut C, value: Handle<JsValue>) -> NeonResult<RestFilterHandle> {
  match value.downcast::<JsRestFilter, _>(cx) {
    Ok(val) => {
      let val = (**val).clone();
      Ok(val)
    }
    Err(_) => cx.throw_type_error::<_, RestFilterHandle>("JsRestFilter".to_string()),
  }
}

pub fn new(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let hammerfest = cx.argument::<JsValue>(0)?;
  let cb = cx.argument::<JsFunction>(1)?.root(&mut cx);

  let hammerfest: Arc<DynHammerfestService> = get_native_hammerfest_service(&mut cx, hammerfest)?;

  let res = async move {
    let router_api = RouterApi { hammerfest };
    let filter = create_rest_filter(router_api);
    RestFilterHandle::new(filter)
  };

  resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res| Ok(c.boxed(res).upcast()))
}

pub fn handle(mut cx: FunctionContext) -> JsResult<JsUndefined> {
  let inner = cx.argument::<JsValue>(0)?;
  let req = cx.argument::<JsValue>(1)?;
  let cb = cx.argument::<JsFunction>(2)?.root(&mut cx);

  let inner = get_native_rest(&mut cx, inner)?;
  let req = HttpRequest::from_js(&mut cx, req)?;

  let res = async move { HttpResponse(req.to_warp().reply(&inner.0).await) };

  resolve_callback_with(&mut cx, res, cb, |c: &mut TaskContext, res: HttpResponse| {
    match res.to_js(c) {
      Ok(r) => Ok(r.upcast()),
      Err(e) => Err(JsError::error(c, format!("{}", e)).unwrap().upcast()),
    }
  })
}
