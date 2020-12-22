use neon::prelude::*;
use neon::register_module;

mod clock;
mod dinoparc_store;
mod neon_namespace;
mod tokio_runtime;
mod uuid;

fn export(mut cx: ModuleContext) -> NeonResult<()> {
  let cx = &mut cx;
  let clock = crate::clock::create_namespace(cx)?;
  cx.export_value("clock", clock)?;
  let dinoparc_store = crate::dinoparc_store::create_namespace(cx)?;
  cx.export_value("dinoparcStore", dinoparc_store)?;
  let uuid = crate::uuid::create_namespace(cx)?;
  cx.export_value("uuid", uuid)?;
  Ok(())
}

register_module!(cx, {
  export(cx)
});

// #[neon::main]
// fn main(mut cx: ModuleContext) -> NeonResult<()> {
//   export(cx)
// }
