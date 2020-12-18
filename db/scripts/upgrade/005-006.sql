COMMENT ON SCHEMA public IS '{"version": 6}';

ALTER TABLE hammerfest_user_links
  ADD PRIMARY KEY (user_id, hammerfest_server, hammerfest_user_id);
ALTER TABLE hammerfest_user_links
  ADD UNIQUE (user_id, hammerfest_server);
ALTER TABLE hammerfest_user_links
  ADD UNIQUE (hammerfest_server, hammerfest_user_id);

ALTER TABLE twinoid_user_links
  ADD UNIQUE (user_id);
ALTER TABLE twinoid_user_links
  ADD UNIQUE (twinoid_user_id);
