ALTER TABLE dinoparc_dinoz_profiles
  ALTER COLUMN race TYPE VARCHAR(50);

DROP DOMAIN dinoparc_dinoz_race;

UPDATE dinoparc_dinoz_profiles SET race = 'Gorilloz' WHERE race = 'Gorriloz';

CREATE DOMAIN dinoparc_dinoz_race AS VARCHAR(50) CHECK (value IN ('Cargou', 'Castivore', 'Gorriloz', 'Gorilloz', 'Gluon', 'Hippoclamp', 'Kabuki', 'Korgon', 'Kump', 'Moueffe', 'Ouistiti', 'Picori', 'Pigmou', 'Pteroz', 'Rokky', 'Santaz', 'Serpantin', 'Sirain', 'Wanwan', 'Winks'));

ALTER TABLE dinoparc_dinoz_profiles
  ALTER COLUMN race TYPE dinoparc_dinoz_race;
