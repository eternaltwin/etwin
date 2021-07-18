ALTER TABLE dinoparc_dinoz_names
  ALTER COLUMN name DROP NOT NULL;

CREATE TABLE dinoparc_dinoz_skins (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_dinoz_id DINOPARC_DINOZ_ID NOT NULL,
--
  race DINOPARC_DINOZ_RACE NOT NULL,
  skin DINOPARC_DINOZ_SKIN NOT NULL,
  PRIMARY KEY (period, dinoparc_server, dinoparc_dinoz_id),
  EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_dinoz_id WITH =, period WITH &&),
  CONSTRAINT dinoparc_dinoz_profiles__dinoz__fk FOREIGN KEY (dinoparc_server, dinoparc_dinoz_id) REFERENCES dinoparc_dinoz(dinoparc_server, dinoparc_dinoz_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO dinoparc_dinoz_skins(period, retrieved_at, dinoparc_server, dinoparc_dinoz_id, race, skin) SELECT period, retrieved_at, dinoparc_server, dinoparc_dinoz_id, race, skin FROM dinoparc_dinoz_profiles;

ALTER TABLE dinoparc_dinoz_profiles
  DROP COLUMN race,
  DROP COLUMN skin;
