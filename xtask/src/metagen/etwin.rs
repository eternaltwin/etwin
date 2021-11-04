use crate::metagen::core::{MgGroupName, MgType, TypeRegistryBuilder};

pub fn register_etwin(builder: &mut TypeRegistryBuilder) -> Result<(), anyhow::Error> {
  register_dinoparc(builder)?;
  register_hammerfest(builder)?;
  register_user(builder)?;
  Ok(())
}

pub fn register_dinoparc(builder: &mut TypeRegistryBuilder) -> Result<(), anyhow::Error> {
  let group = MgGroupName::from_parts("dinoparc")?;
  builder.add_unique(group.with_type("dinoparc_dinoz_id")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_dinoz_life")?, MgType::U8)?;
  builder.add_unique(group.with_type("dinoparc_dinoz_experience")?, MgType::U8)?;
  builder.add_unique(group.with_type("dinoparc_dinoz_level")?, MgType::U16)?;
  builder.add_unique(group.with_type("dinoparc_skill_level")?, MgType::U8)?;
  builder.add_unique(group.with_type("dinoparc_dinoz_danger")?, MgType::I16)?;
  builder.add_unique(group.with_type("dinoparc_dinoz_element_level")?, MgType::U16)?;
  builder.add_unique(group.with_type("dinoparc_dinoz_name")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_dinoz_skin")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_item_id")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_item_count")?, MgType::U32)?;
  builder.add_unique(group.with_type("dinoparc_location_id")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_user_id")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_user_bills")?, MgType::U32)?;
  builder.add_unique(group.with_type("dinoparc_user_coins")?, MgType::U32)?;
  builder.add_unique(group.with_type("dinoparc_username")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_reward_id")?, MgType::String)?;
  builder.add_unique(group.with_type("dinoparc_epic_reward_key")?, MgType::String)?;
  Ok(())
}

pub fn register_hammerfest(builder: &mut TypeRegistryBuilder) -> Result<(), anyhow::Error> {
  let group = MgGroupName::from_parts("hammerfest")?;
  builder.add_unique(group.with_type("hammerfest_user_id")?, MgType::String)?;
  builder.add_unique(group.with_type("hammerfest_username")?, MgType::String)?;
  Ok(())
}

pub fn register_user(builder: &mut TypeRegistryBuilder) -> Result<(), anyhow::Error> {
  let group = MgGroupName::from_parts("user")?;
  builder.add_unique(group.with_type("user_display_name")?, MgType::String)?;
  builder.add_unique(group.with_type("user_id")?, MgType::Uuid)?;
  Ok(())
}
