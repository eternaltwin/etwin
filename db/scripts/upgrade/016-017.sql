CREATE DOMAIN int_percentage AS U8 CHECK (value <= 100);

CREATE DOMAIN dinoparc_location_id AS VARCHAR(2) CHECK (value ~ '^\d{1,2}$');
CREATE DOMAIN dinoparc_item_id AS VARCHAR(10) CHECK (value ~ '^[1-9]\d{0,9}$');
CREATE DOMAIN dinoparc_item_count_map_id AS UUID;
CREATE DOMAIN dinoparc_skill_level_map_id AS UUID;

CREATE DOMAIN dinoparc_dinoz_name AS VARCHAR(100);

CREATE DOMAIN dinoparc_skill AS VARCHAR(50) CHECK (value IN ('Bargain', 'Camouflage', 'Climb', 'Cook', 'Counterattack', 'Dexterity', 'Dig', 'EarthApprentice', 'FireApprentice', 'FireProtection', 'Intelligence', 'Juggle', 'Jump', 'Luck', 'MartialArts', 'Medicine', 'Mercenary', 'Music', 'Navigation', 'Perception', 'Provoke', 'Run', 'Saboteur', 'ShadowPower', 'Spy', 'Stamina', 'Steal', 'Strategy', 'Strength', 'Survival', 'Swim', 'TotemThief', 'ThunderApprentice', 'WaterApprentice'));
CREATE DOMAIN dinoparc_skill_level AS U8 CHECK (value <= 5);

CREATE DOMAIN dinoparc_dinoz_race AS VARCHAR(50) CHECK (value IN ('Cargou', 'Castivore', 'Gorriloz', 'Gluon', 'Hippoclamp', 'Kabuki', 'Korgon', 'Kump', 'Moueffe', 'Ouistiti', 'Picori', 'Pigmou', 'Pteroz', 'Rokky', 'Santaz', 'Serpantin', 'Sirain', 'Wanwan', 'Winks'));
CREATE DOMAIN dinoparc_dinoz_skin AS VARCHAR(100);

CREATE TYPE RAW_DINOPARC_DINOZ_ELEMENTS AS (
  fire U16,
  earth U16,
  water U16,
  thunder U16,
  air U16
);

CREATE DOMAIN DINOPARC_DINOZ_ELEMENTS AS RAW_DINOPARC_DINOZ_ELEMENTS CHECK (
  value IS NULL OR (
        (value).fire IS NOT NULL
    AND (value).earth IS NOT NULL
    AND (value).water IS NOT NULL
    AND (value).thunder IS NOT NULL
    AND (value).air IS NOT NULL
  )
);

-- Permanent data for dinoparc dinoz
CREATE TABLE dinoparc_dinoz (
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_dinoz_id DINOPARC_DINOZ_ID NOT NULL,
  archived_at INSTANT NOT NULL,
  PRIMARY KEY (dinoparc_server, dinoparc_dinoz_id),
  CONSTRAINT dinoparc_dinoz__servers__fk FOREIGN KEY (dinoparc_server) REFERENCES dinoparc_servers(dinoparc_server) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE dinoparc_locations (
  -- Dinoparc location id, in practice `0 <= loc_id < 23`.
  dinoparc_location_id DINOPARC_LOCATION_ID PRIMARY KEY NOT NULL
);

-- Immutable item counts (may be shared by different users)
CREATE TABLE dinoparc_item_count_maps (
  dinoparc_item_count_map_id DINOPARC_ITEM_COUNT_MAP_ID NOT NULL,
-- sha3_256(utf8(json(value)))
-- Where `value` is a map from the item id to the count, sorted by id and json does not use any whitespace
-- {"0":0,"2":9,"30":5}
  _sha3_256 BYTEA NOT NULL,
  PRIMARY KEY (dinoparc_item_count_map_id),
  UNIQUE (_sha3_256)
);

-- Content of dinoparc_item_count_maps
CREATE TABLE dinoparc_item_count_map_items (
  dinoparc_item_count_map_id DINOPARC_ITEM_COUNT_MAP_ID NOT NULL,
  dinoparc_item_id DINOPARC_ITEM_ID NOT NULL,
  count U32 NOT NULL,
  PRIMARY KEY (dinoparc_item_count_map_id, dinoparc_item_id),
  CONSTRAINT dinoparc_item_count_map_item__map__fk FOREIGN KEY (dinoparc_item_count_map_id) REFERENCES dinoparc_item_count_maps(dinoparc_item_count_map_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Immutable skill levels (may be shared by different dinoz)
CREATE TABLE dinoparc_skill_level_maps (
  dinoparc_skill_level_map_id DINOPARC_SKILL_LEVEL_MAP_ID NOT NULL,
-- sha3_256(utf8(json(value)))
-- Where `value` is a map from the skill to the level, sorted by skill and json does not use any whitespace
-- {"Bargain":1,"Camouflage":2}
  _sha3_256 BYTEA NOT NULL,
  PRIMARY KEY (dinoparc_skill_level_map_id),
  UNIQUE (_sha3_256)
);

-- Content of dinoparc_skill_level_maps
CREATE TABLE dinoparc_skill_level_map_items (
  dinoparc_skill_level_map_id DINOPARC_SKILL_LEVEL_MAP_ID NOT NULL,
  dinoparc_skill DINOPARC_SKILL NOT NULL,
  level DINOPARC_SKILL_LEVEL NOT NULL,
  PRIMARY KEY (dinoparc_skill_level_map_id, dinoparc_skill),
  CONSTRAINT dinoparc_skill_level_map_item__map__fk FOREIGN KEY (dinoparc_skill_level_map_id) REFERENCES dinoparc_skill_level_maps(dinoparc_skill_level_map_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant game coins <any(logged)>
CREATE TABLE dinoparc_coins (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_user_id DINOPARC_USER_ID NOT NULL,
--
  coins U32 NOT NULL,
  PRIMARY KEY (period, dinoparc_server, dinoparc_user_id),
  EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_user_id WITH =, period WITH &&),
  CONSTRAINT dinoparc_coins__user__fk FOREIGN KEY (dinoparc_server, dinoparc_user_id) REFERENCES dinoparc_users(dinoparc_server, dinoparc_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant dinoz names (may change following a fusion) <any(logged) + exchangeWith>
CREATE TABLE dinoparc_dinoz_names (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_dinoz_id DINOPARC_DINOZ_ID NOT NULL,
--
  name DINOPARC_DINOZ_NAME NOT NULL,
  PRIMARY KEY (period, dinoparc_server, dinoparc_dinoz_id),
  EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_dinoz_id WITH =, period WITH &&),
  CONSTRAINT dinoparc_dinoz_names__dinoz__fk FOREIGN KEY (dinoparc_server, dinoparc_dinoz_id) REFERENCES dinoparc_dinoz(dinoparc_server, dinoparc_dinoz_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant dinoz owners (Dinoz may be exchanged) <any(logged) + exchangeWith>
CREATE TABLE dinoparc_dinoz_owners (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_dinoz_id DINOPARC_DINOZ_ID NOT NULL,
--
  owner DINOPARC_USER_ID NOT NULL,
  PRIMARY KEY (period, dinoparc_server, dinoparc_dinoz_id),
  EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_dinoz_id WITH =, period WITH &&),
  CONSTRAINT dinoparc_dinoz_names__dinoz__fk FOREIGN KEY (dinoparc_server, dinoparc_dinoz_id) REFERENCES dinoparc_dinoz(dinoparc_server, dinoparc_dinoz_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT dinoparc_dinoz_names__owner__fk FOREIGN KEY (dinoparc_server, owner) REFERENCES dinoparc_users(dinoparc_server, dinoparc_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant dinoz locations <any(logged)>
CREATE TABLE dinoparc_dinoz_locations (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_dinoz_id DINOPARC_DINOZ_ID NOT NULL,
--
  location DINOPARC_LOCATION_ID NOT NULL,
  PRIMARY KEY (period, dinoparc_server, dinoparc_dinoz_id),
  EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_dinoz_id WITH =, period WITH &&),
  CONSTRAINT dinoparc_dinoz_locations__dinoz__fk FOREIGN KEY (dinoparc_server, dinoparc_dinoz_id) REFERENCES dinoparc_dinoz(dinoparc_server, dinoparc_dinoz_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT dinoparc_dinoz_locations__location__fk FOREIGN KEY (location) REFERENCES dinoparc_locations(dinoparc_location_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant dinoz levels <dinoz + exchangeWith>
CREATE TABLE dinoparc_dinoz_levels (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_dinoz_id DINOPARC_DINOZ_ID NOT NULL,
--
  level U16 NOT NULL,
  PRIMARY KEY (period, dinoparc_server, dinoparc_dinoz_id),
  EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_dinoz_id WITH =, period WITH &&),
  CONSTRAINT dinoparc_dinoz_levels__dinoz__fk FOREIGN KEY (dinoparc_server, dinoparc_dinoz_id) REFERENCES dinoparc_dinoz(dinoparc_server, dinoparc_dinoz_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant dinoz data unique to their profile <dinoz>
CREATE TABLE dinoparc_dinoz_profiles (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_dinoz_id DINOPARC_DINOZ_ID NOT NULL,
--
  race DINOPARC_DINOZ_RACE NOT NULL,
  skin DINOPARC_DINOZ_SKIN NOT NULL,
  life int_percentage NOT NULL,
  experience int_percentage NOT NULL,
  danger i16 NOT NULL,
  in_tournament BOOLEAN NOT NULL,
  elements DINOPARC_DINOZ_ELEMENTS NOT NULL,
  skills dinoparc_skill_level_map_id NOT NULL,
  PRIMARY KEY (period, dinoparc_server, dinoparc_dinoz_id),
  EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_dinoz_id WITH =, period WITH &&),
  CONSTRAINT dinoparc_dinoz_profiles__dinoz__fk FOREIGN KEY (dinoparc_server, dinoparc_dinoz_id) REFERENCES dinoparc_dinoz(dinoparc_server, dinoparc_dinoz_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT dinoparc_dinoz_profiles__skills__fk FOREIGN KEY (skills) REFERENCES dinoparc_skill_level_maps(dinoparc_skill_level_map_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data for dinoparc inventories <inventory>
CREATE TABLE dinoparc_inventories (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_user_id DINOPARC_USER_ID NOT NULL,
--
  item_counts DINOPARC_ITEM_COUNT_MAP_ID NOT NULL,
  PRIMARY KEY (period, dinoparc_server, dinoparc_user_id),
  EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_user_id WITH =, period WITH &&),
  CONSTRAINT dinoparc_inventories__user__fk FOREIGN KEY (dinoparc_server, dinoparc_user_id) REFERENCES dinoparc_users(dinoparc_server, dinoparc_user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT dinoparc_inventories__item_counts__fk FOREIGN KEY (item_counts) REFERENCES dinoparc_item_count_maps(dinoparc_item_count_map_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant counts of Dinoz owned by a user <any(logged) + exchange>
CREATE TABLE dinoparc_user_dinoz_counts (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_user_id DINOPARC_USER_ID NOT NULL,
--
  dinoz_count U8 NOT NULL,
  PRIMARY KEY (period, dinoparc_server, dinoparc_user_id),
  EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_user_id WITH =, period WITH &&),
  CONSTRAINT dinoparc_user_dinoz_counts__user__fk FOREIGN KEY (dinoparc_server, dinoparc_user_id) REFERENCES dinoparc_users(dinoparc_server, dinoparc_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant Dinoz list items <any(logged) + exchange>
CREATE TABLE dinoparc_user_dinoz (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_user_id DINOPARC_USER_ID NOT NULL,
  offset_in_list U8 NOT NULL,
--
  dinoparc_dinoz_id DINOPARC_DINOZ_ID NOT NULL,
  PRIMARY KEY (period, dinoparc_server, dinoparc_user_id, offset_in_list),
  EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_user_id WITH =, offset_in_list WITH =, period WITH &&),
  EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_dinoz_id WITH =, period WITH &&),
  CONSTRAINT dinoparc_user_dinoz__user__fk FOREIGN KEY (dinoparc_server, dinoparc_user_id) REFERENCES dinoparc_users(dinoparc_server, dinoparc_user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT dinoparc_user_dinoz__dinoz__fk FOREIGN KEY (dinoparc_server, dinoparc_dinoz_id) REFERENCES dinoparc_dinoz(dinoparc_server, dinoparc_dinoz_id) ON DELETE RESTRICT ON UPDATE CASCADE
);
