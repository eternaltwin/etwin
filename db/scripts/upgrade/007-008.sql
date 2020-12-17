COMMENT ON SCHEMA public IS '{"version": 8}';

CREATE DOMAIN announcement_id AS UUID;
CREATE DOMAIN forum_thread_id AS UUID;
CREATE DOMAIN locale_id AS VARCHAR(10);

CREATE TABLE public.announcements (
  announcement_id ANNOUNCEMENT_ID PRIMARY KEY NOT NULL,
  forum_thread_id FORUM_THREAD_ID NOT NULL,
  locale LOCALE_ID NULL,
  created_at INSTANT NOT NULL,
  created_by USER_ID NOT NULL,
  -- TODO: game id
  CONSTRAINT announcement__forum_thread__fk FOREIGN KEY (forum_thread_id) REFERENCES forum_threads(forum_thread_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT announcement__user__fk FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);
