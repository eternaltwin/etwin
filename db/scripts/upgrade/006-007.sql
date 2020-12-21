COMMENT ON SCHEMA public IS '{"version": 7}';

ALTER TABLE hammerfest_user_links
  ALTER COLUMN user_id TYPE USER_ID;
ALTER TABLE hammerfest_user_links
  RENAME ctime TO linked_at;
ALTER TABLE hammerfest_user_links
  ADD COLUMN linked_by USER_ID NULL;

UPDATE hammerfest_user_links
SET linked_by = user_id;

ALTER TABLE hammerfest_user_links
  ALTER COLUMN linked_by SET NOT NULL;

ALTER TABLE hammerfest_user_links
  ADD CONSTRAINT hammerfest_user_link_linked_by__user__fk FOREIGN KEY (linked_by) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE twinoid_user_links
  ALTER COLUMN user_id TYPE USER_ID;
ALTER TABLE twinoid_user_links
  RENAME ctime TO linked_at;
ALTER TABLE twinoid_user_links
  ADD COLUMN linked_by USER_ID NULL;

UPDATE twinoid_user_links
SET linked_by = user_id;

ALTER TABLE twinoid_user_links
  ALTER COLUMN linked_by SET NOT NULL;

ALTER TABLE twinoid_user_links
  ADD CONSTRAINT twinoid_user_link_linked_by__user__fk FOREIGN KEY (linked_by) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE;
