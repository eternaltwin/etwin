COMMENT ON SCHEMA public IS '{"version": 9}';

-- Hammerfest

CREATE DOMAIN hammerfest_username AS VARCHAR(20) CHECK (value ~ '^[0-9A-Za-z]{1,12}$');

ALTER TABLE hammerfest_users
  ADD COLUMN archived_at INSTANT NULL;

UPDATE hammerfest_users
SET archived_at = NOW();

ALTER TABLE hammerfest_users
  ALTER COLUMN archived_at SET NOT NULL;

UPDATE hammerfest_users
SET archived_at = linked_at
FROM hammerfest_user_links
WHERE hammerfest_user_links.hammerfest_server = hammerfest_users.hammerfest_server AND
  hammerfest_user_links.hammerfest_user_id = hammerfest_users.hammerfest_user_id;

-- Dinoparc

ALTER TABLE dinoparc_users
  ADD COLUMN archived_at INSTANT NULL;

UPDATE dinoparc_users
SET archived_at = NOW();

ALTER TABLE dinoparc_users
  ALTER COLUMN archived_at SET NOT NULL;

UPDATE dinoparc_users
SET archived_at = linked_at
FROM dinoparc_user_links
WHERE dinoparc_user_links.dinoparc_server = dinoparc_users.dinoparc_server AND
  dinoparc_user_links.dinoparc_user_id = dinoparc_users.dinoparc_user_id;

-- Twinoid

ALTER TABLE twinoid_users
  ADD COLUMN archived_at INSTANT NULL;

UPDATE twinoid_users
SET archived_at = NOW();

ALTER TABLE twinoid_users
  ALTER COLUMN archived_at SET NOT NULL;

UPDATE twinoid_users
SET archived_at = linked_at
FROM twinoid_user_links
WHERE twinoid_user_links.twinoid_user_id = twinoid_users.twinoid_user_id;
