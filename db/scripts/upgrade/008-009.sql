COMMENT ON SCHEMA public IS '{"version": 9}';

CREATE DOMAIN hammerfest_username AS VARCHAR(20) CHECK (value ~ '^[0-9A-Za-z]{1,12}$');

ALTER TABLE hammerfest_users
  ADD COLUMN archived_at INSTANT NULL;

ALTER TABLE dinoparc_users
  ADD COLUMN archived_at INSTANT NULL;
