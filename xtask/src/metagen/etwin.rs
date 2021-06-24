use crate::metagen::core::{MgGroupName, MgType, TypeRegistryBuilder};

pub fn register_etwin(builder: &mut TypeRegistryBuilder) -> Result<(), anyhow::Error> {
  register_dinoparc(builder)?;
  register_hammerfest(builder)?;
  Ok(())
}

pub fn register_dinoparc(builder: &mut TypeRegistryBuilder) -> Result<(), anyhow::Error> {
  let group = MgGroupName::from_parts("dinoparc")?;
  builder.add_unique(group.with_type("dinoparc_dinoz_id")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_dinoz_name")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_dinoz_skin")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_item_id")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_location_id")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_user_id")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_username")?, MgType::String)?;
  Ok(())
}

pub fn register_hammerfest(builder: &mut TypeRegistryBuilder) -> Result<(), anyhow::Error> {
  let group = MgGroupName::from_parts("hammerfest")?;
  builder.add_unique(group.with_type("hammerfest_user_id")?, MgType::String)?;
  builder.add_unique(group.with_type("hammerfest_username")?, MgType::String)?;
  Ok(())
}
