ALTER TABLE dinoparc_dinoz_profiles
  ALTER COLUMN race TYPE VARCHAR(50);

DROP DOMAIN dinoparc_dinoz_race;

UPDATE dinoparc_dinoz_profiles SET race = 'Gorilloz' WHERE race = 'Gorriloz';

CREATE DOMAIN dinoparc_dinoz_race AS VARCHAR(50) CHECK (value IN ('Cargou', 'Castivore', 'Gorriloz', 'Gorilloz', 'Gluon', 'Hippoclamp', 'Kabuki', 'Korgon', 'Kump', 'Moueffe', 'Ouistiti', 'Picori', 'Pigmou', 'Pteroz', 'Rokky', 'Santaz', 'Serpantin', 'Sirain', 'Wanwan', 'Winks'));

ALTER TABLE dinoparc_dinoz_profiles
  ALTER COLUMN race TYPE dinoparc_dinoz_race;

ALTER DOMAIN dinoparc_user_id DROP CONSTRAINT dinoparc_user_id_check;
ALTER DOMAIN dinoparc_user_id ADD CONSTRAINT dinoparc_user_id_check CHECK (value ~ '^(?:0|[1-9]\d{0,9})$');

ALTER DOMAIN dinoparc_dinoz_id DROP CONSTRAINT dinoparc_dinoz_id_check;
ALTER DOMAIN dinoparc_dinoz_id ADD CONSTRAINT dinoparc_dinoz_id_check CHECK (value ~ '^(?:0|[1-9]\d{0,9})$');

-- Time-variant game bills <any(exchange)>
CREATE TABLE dinoparc_bills (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_user_id DINOPARC_USER_ID NOT NULL,
--
  bills U32 NOT NULL,
  PRIMARY KEY (period, dinoparc_server, dinoparc_user_id),
  EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_user_id WITH =, period WITH &&),
  CONSTRAINT dinoparc_bills__user__fk FOREIGN KEY (dinoparc_server, dinoparc_user_id) REFERENCES dinoparc_users(dinoparc_server, dinoparc_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);
