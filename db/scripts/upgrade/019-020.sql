ALTER TABLE dinoparc_epic_reward_set_items
  ALTER COLUMN dinoparc_epic_reward_key TYPE VARCHAR(30);

DROP DOMAIN dinoparc_epic_reward_key;
CREATE DOMAIN dinoparc_epic_reward_key AS VARCHAR(30) CHECK (value ~ '^[a-z0-9_]{1,30}$');

ALTER TABLE dinoparc_epic_reward_set_items
  ALTER COLUMN dinoparc_epic_reward_key TYPE dinoparc_epic_reward_key;
