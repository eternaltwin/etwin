COMMENT ON SCHEMA public IS '{"version": 13}';

ALTER TABLE hammerfest_user_links
  ADD COLUMN period PERIOD_FROM NULL,
  ADD COLUMN unlinked_by USER_ID NULL;

UPDATE hammerfest_user_links SET period = PERIOD(linked_at, NULL);

ALTER TABLE hammerfest_user_links
  ALTER COLUMN period SET NOT NULL,
  DROP COLUMN linked_at;

ALTER TABLE hammerfest_user_links
  ADD CHECK ((upper_inf(period) AND unlinked_by IS NULL) OR (NOT upper_inf(period) AND unlinked_by IS NOT NULL)),
  ADD CONSTRAINT hammerfest_user_link_unlinked_by__user__fk FOREIGN KEY (unlinked_by) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE hammerfest_user_links
  DROP CONSTRAINT hammerfest_user_links_pkey;
ALTER TABLE hammerfest_user_links
  ADD PRIMARY KEY (user_id, hammerfest_server, hammerfest_user_id, period);

ALTER TABLE hammerfest_user_links
  DROP CONSTRAINT hammerfest_user_links_user_id_hammerfest_server_key;
ALTER TABLE hammerfest_user_links
  ADD EXCLUDE USING gist (user_id WITH =, hammerfest_server WITH =, period WITH &&);

ALTER TABLE hammerfest_user_links
  DROP CONSTRAINT hammerfest_user_links_hammerfest_server_hammerfest_user_id_key;
ALTER TABLE hammerfest_user_links
  ADD EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, period WITH &&);


ALTER TABLE dinoparc_user_links
  ADD COLUMN period PERIOD_FROM NULL,
  ADD COLUMN unlinked_by USER_ID NULL;

UPDATE dinoparc_user_links SET period = PERIOD(linked_at, NULL);

ALTER TABLE dinoparc_user_links
  ALTER COLUMN period SET NOT NULL,
  DROP COLUMN linked_at;

ALTER TABLE dinoparc_user_links
  ADD CHECK ((upper_inf(period) AND unlinked_by IS NULL) OR (NOT upper_inf(period) AND unlinked_by IS NOT NULL)),
  ADD CONSTRAINT dinoparc_user_link_unlinked_by__user__fk FOREIGN KEY (unlinked_by) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE dinoparc_user_links
  DROP CONSTRAINT dinoparc_user_links_pkey;
ALTER TABLE dinoparc_user_links
  ADD PRIMARY KEY (user_id, dinoparc_server, dinoparc_user_id, period);

ALTER TABLE dinoparc_user_links
  DROP CONSTRAINT dinoparc_user_links_user_id_dinoparc_server_key;
ALTER TABLE dinoparc_user_links
  ADD EXCLUDE USING gist (user_id WITH =, dinoparc_server WITH =, period WITH &&);

ALTER TABLE dinoparc_user_links
  DROP CONSTRAINT dinoparc_user_links_dinoparc_server_dinoparc_user_id_key;
ALTER TABLE dinoparc_user_links
  ADD EXCLUDE USING gist (dinoparc_server WITH =, dinoparc_user_id WITH =, period WITH &&);


ALTER TABLE twinoid_user_links
  ADD COLUMN period PERIOD_FROM NULL,
  ADD COLUMN unlinked_by USER_ID NULL;

UPDATE twinoid_user_links SET period = PERIOD(linked_at, NULL);

ALTER TABLE twinoid_user_links
  ALTER COLUMN period SET NOT NULL,
  DROP COLUMN linked_at;

ALTER TABLE twinoid_user_links
  ADD CHECK ((upper_inf(period) AND unlinked_by IS NULL) OR (NOT upper_inf(period) AND unlinked_by IS NOT NULL)),
  ADD CONSTRAINT twinoid_user_link_unlinked_by__user__fk FOREIGN KEY (unlinked_by) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE twinoid_user_links
  DROP CONSTRAINT twinoid_user_links_pkey;
ALTER TABLE twinoid_user_links
  ADD PRIMARY KEY (user_id, twinoid_user_id, period);

ALTER TABLE twinoid_user_links
  DROP CONSTRAINT twinoid_user_links_user_id_key;
ALTER TABLE twinoid_user_links
  ADD EXCLUDE USING gist (user_id WITH =, period WITH &&);

ALTER TABLE twinoid_user_links
  DROP CONSTRAINT twinoid_user_links_twinoid_user_id_key;
ALTER TABLE twinoid_user_links
  ADD EXCLUDE USING gist (twinoid_user_id WITH =, period WITH &&);

DROP TABLE old_twinoid_user_links;
