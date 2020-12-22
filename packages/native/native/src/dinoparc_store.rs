use crate::neon_namespace::NeonNamespace;
use neon::prelude::*;

pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
  let ns = cx.empty_object();
  ns.set_with(cx, "mem", mem::create_namespace)?;
  Ok(ns)
}

pub mod mem {
  use crate::neon_namespace::NeonNamespace;
  use etwin_core::clock::Clock;
  use neon::prelude::*;
  use std::sync::Arc;
  use etwin_dinoparc_store::mem::MemDinoparcStore;
  use crate::clock::system_clock::SystemClockBox;
  use etwin_core::dinoparc::{DinoparcStore, GetDinoparcUserOptions, ShortDinoparcUser, TaggedShortDinoparcUser};
  use crate::clock::system_clock::JsSystemClock;
  use crate::tokio_runtime::spawn_future;

  pub fn create_namespace<'a, C: Context<'a>>(cx: &mut C) -> JsResult<'a, JsObject> {
    let ns = cx.empty_object();
    ns.set_function(cx, "new", new)?;
    ns.set_function(cx, "getShortUser", get_short_user)?;
    ns.set_function(cx, "touchShortUser", touch_short_user)?;
    Ok(ns)
  }

  pub type MemDinoparcStoreBox = Arc<MemDinoparcStore<Arc<dyn Clock>>>;

  declare_types! {
    pub class JsMemDinoparcStore for MemDinoparcStoreBox {
      init(mut cx) {
        let clock = cx.argument::<JsSystemClock>(0)?;
        let clock = cx.borrow(&clock, |boxed: neon::borrow::Ref<&mut SystemClockBox>| {
          Arc::clone(&*boxed)
        });
        Ok(Arc::new(MemDinoparcStore::new(clock)))
      }
    }
  }

  pub fn new(mut cx: FunctionContext) -> JsResult<JsMemDinoparcStore> {
    let ctr = JsMemDinoparcStore::constructor(&mut cx)?;
    let clock = cx.argument::<JsSystemClock>(0)?;
    let args: Vec<Handle<JsValue>> = vec![clock.upcast()];
    let js_box = ctr.construct(&mut cx, args)?;
    Ok(js_box)
  }

  pub fn get_short_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let boxed = cx.argument::<JsMemDinoparcStore>(0)?;
    let options_json = cx.argument::<JsString>(1)?;
    let cb = cx.argument::<JsFunction>(2)?;
    let null = cx.null();
    let handler = EventHandler::new(&mut cx, null, cb);
    let options: GetDinoparcUserOptions = serde_json::from_str(&options_json.value()).unwrap();

    let boxed = cx.borrow(&boxed, |boxed: neon::borrow::Ref<&mut MemDinoparcStoreBox>| {
      Arc::clone(&*boxed)
    });

    spawn_future(Box::pin(async move {
      let user = boxed.get_short_user(&options).await.unwrap();
      let user_json = match user {
        Some(user) => {
          Some(serde_json::to_string(&TaggedShortDinoparcUser::new(user)).unwrap())
        },
        None => None,
      };
      handler.schedule(move |cx| {
        let err: Handle<JsValue> = cx.null().upcast();
        let res: Handle<JsValue> = match user_json {
          Some(user) => {
            cx.string(user).upcast()
          },
          None => cx.null().upcast(),
        };
        let args: Vec<Handle<JsValue>> = vec![err, res];
        args
      })
    }));

    Ok(cx.undefined())
  }

  pub fn touch_short_user(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let boxed = cx.argument::<JsMemDinoparcStore>(0)?;
    let short_json = cx.argument::<JsString>(1)?;
    let cb = cx.argument::<JsFunction>(2)?;
    let null = cx.null();
    let handler = EventHandler::new(&mut cx, null, cb);
    let short: ShortDinoparcUser = serde_json::from_str(&short_json.value()).unwrap();

    let boxed = cx.borrow(&boxed, |boxed: neon::borrow::Ref<&mut MemDinoparcStoreBox>| {
      Arc::clone(&*boxed)
    });

    spawn_future(Box::pin(async move {
      let user = boxed.touch_short_user(&short).await.unwrap();
      let user_json = serde_json::to_string(&TaggedShortDinoparcUser::new(user)).unwrap();
      handler.schedule(move |cx| {
        let err: Handle<JsValue> = cx.null().upcast();
        let res: Handle<JsValue> = cx.string(user_json).upcast();
        let args: Vec<Handle<JsValue>> = vec![err, res];
        args
      })
    }));

    Ok(cx.undefined())
  }
}
