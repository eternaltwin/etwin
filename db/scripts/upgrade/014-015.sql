CREATE DOMAIN dinoparc_dinoz_id AS VARCHAR(10) CHECK (value ~ '^[1-9]\d{0,9}$');
