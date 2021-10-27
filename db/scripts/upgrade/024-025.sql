CREATE TYPE forum_role_grant_by_section AS (
  user_id USER_ID,
  start_time INSTANT,
  granted_by USER_ID
);

CREATE VIEW forum_section_meta AS
WITH
  thread_count AS (
    SELECT forum_section_id, COUNT(*)::U32 AS thread_count FROM forum_threads GROUP BY forum_section_id
  ),
  role_grants AS (
    SELECT forum_section_id,
      ARRAY_AGG(ROW (user_id, start_time, granted_by)::forum_role_grant_by_section) AS role_grants
    FROM forum_role_grants
    GROUP BY forum_section_id
  )
SELECT forum_section_id, key, ctime, display_name, locale, COALESCE(thread_count, 0) AS thread_count,
  COALESCE(role_grants, '{}') AS role_grants
FROM forum_sections
  LEFT OUTER JOIN thread_count USING (forum_section_id)
  LEFT OUTER JOIN role_grants USING (forum_section_id);

CREATE VIEW forum_thread_meta AS
WITH
  post_count AS (
    SELECT forum_thread_id, COUNT(*)::U32 AS post_count FROM forum_posts GROUP BY forum_thread_id
  )
SELECT forum_thread_id, key, ctime, title, title_mtime, forum_section_id, is_pinned, is_locked, COALESCE(post_count, 0) AS post_count
FROM forum_threads
  LEFT OUTER JOIN post_count USING (forum_thread_id);

CREATE DOMAIN forum_thread_title AS VARCHAR(64);
CREATE DOMAIN forum_post_id AS UUID;
CREATE DOMAIN forum_post_revision_id AS UUID;
