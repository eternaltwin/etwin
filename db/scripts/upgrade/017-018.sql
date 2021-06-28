CREATE DOMAIN dinoparc_reward_id AS VARCHAR(10) CHECK (value ~ '^[1-9]\d?$');
CREATE DOMAIN dinoparc_epic_reward_key AS VARCHAR(10) CHECK (value ~ '^[a-z0-9_]{1,30}$');
CREATE DOMAIN dinoparc_reward_set_id AS UUID;
CREATE DOMAIN dinoparc_epic_reward_set_id AS UUID;

-- Immutable regular reward set (may be shared by different users)
CREATE TABLE dinoparc_reward_sets (
  dinoparc_reward_set_id DINOPARC_REWARD_SET_ID NOT NULL,
-- sha3_256(utf8(json(value)))
-- Where `value` is an array of reward ids, sorted by id and json does not use any whitespace
-- [2,11,15,20]
  _sha3_256 BYTEA NOT NULL,
  PRIMARY KEY (dinoparc_reward_set_id),
  UNIQUE (_sha3_256)
);

-- Content of dinoparc_reward_sets
CREATE TABLE dinoparc_reward_set_items (
  dinoparc_reward_set_id DINOPARC_REWARD_SET_ID NOT NULL,
  dinoparc_reward_id DINOPARC_REWARD_ID NOT NULL,
  PRIMARY KEY (dinoparc_reward_set_id, dinoparc_reward_id),
  CONSTRAINT dinoparc_reward_set_items__set__fk FOREIGN KEY (dinoparc_reward_set_id) REFERENCES dinoparc_reward_sets(dinoparc_reward_set_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Immutable epic reward set (may be shared by different users)
CREATE TABLE dinoparc_epic_reward_sets (
  dinoparc_epic_reward_set_id DINOPARC_EPIC_REWARD_SET_ID NOT NULL,
-- sha3_256(utf8(json(value)))
-- Where `value` is an array of reward keys, sorted by key and json does not use any whitespace
-- ["a", "bc", "ca", "d"]
  _sha3_256 BYTEA NOT NULL,
  PRIMARY KEY (dinoparc_epic_reward_set_id),
  UNIQUE (_sha3_256)
);

-- Content of dinoparc_reward_sets
CREATE TABLE dinoparc_epic_reward_set_items (
  dinoparc_epic_reward_set_id DINOPARC_EPIC_REWARD_SET_ID NOT NULL,
  dinoparc_epic_reward_key DINOPARC_EPIC_REWARD_KEY NOT NULL,
  PRIMARY KEY (dinoparc_epic_reward_set_id, dinoparc_epic_reward_key),
  CONSTRAINT dinoparc_epic_reward_sets__set__fk FOREIGN KEY (dinoparc_epic_reward_set_id) REFERENCES dinoparc_epic_reward_sets(dinoparc_epic_reward_set_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data for dinoparc collections <collection>
CREATE TABLE dinoparc_collections (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_user_id DINOPARC_USER_ID NOT NULL,
--
  dinoparc_reward_set_id DINOPARC_REWARD_SET_ID NOT NULL,
  dinoparc_epic_reward_set_id DINOPARC_EPIC_REWARD_SET_ID NOT NULL,
  PRIMARY KEY (period, dinoparc_server, dinoparc_user_id),
  EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_user_id WITH =, period WITH &&),
  CONSTRAINT dinoparc_collections__user__fk FOREIGN KEY (dinoparc_server, dinoparc_user_id) REFERENCES dinoparc_users(dinoparc_server, dinoparc_user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT dinoparc_collections__rewards__fk FOREIGN KEY (dinoparc_reward_set_id) REFERENCES dinoparc_reward_sets(dinoparc_reward_set_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT dinoparc_collections__epic_rewards__fk FOREIGN KEY (dinoparc_epic_reward_set_id) REFERENCES dinoparc_epic_reward_sets(dinoparc_epic_reward_set_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

