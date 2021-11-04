use crate::metagen::backend::kotlin::KotlinBackend;
use crate::metagen::backend::php::PhpBackend;
use crate::metagen::core::TypeRegistry;
use crate::metagen::etwin::register_etwin;
use std::error::Error;

pub mod backend;
mod core;
mod etwin;

pub fn kotlin() -> Result<(), Box<dyn Error>> {
  let mut registry = TypeRegistry::builder();
  register_etwin(&mut registry)?;
  let registry = registry.build()?;

  let working_dir = std::env::current_dir()?;
  let backend = KotlinBackend::new(
    working_dir.join("clients/kotlin/src/main/kotlin"),
    vec!["net".to_string(), "eternaltwin".to_string()],
  );
  backend.emit(&registry)?;
  Ok(())
}

pub fn php() -> Result<(), Box<dyn Error>> {
  let mut registry = TypeRegistry::builder();
  register_etwin(&mut registry)?;
  let registry = registry.build()?;

  let working_dir = std::env::current_dir()?;
  let backend = PhpBackend::new(working_dir.join("clients/php/src"), vec!["Eternaltwin".to_string()]);
  backend.emit(&registry)?;
  Ok(())
}
