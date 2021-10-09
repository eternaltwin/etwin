CREATE TYPE forum_role_grant_by_section AS (
  user_id USER_ID,
  start_time INSTANT,
  granted_by USER_ID
);

CREATE VIEW forum_section_meta AS
WITH
  _thread_count AS (
    SELECT forum_section_id, COUNT(*)::U32 AS thread_count FROM forum_threads GROUP BY forum_section_id
  ),
  _role_grants AS (
    SELECT forum_section_id,
      ARRAY_AGG(ROW (user_id, start_time, granted_by)::forum_role_grant_by_section) AS role_grants
    FROM forum_role_grants
    GROUP BY forum_section_id
  )
SELECT forum_section_id, key, ctime, display_name, locale, COALESCE(thread_count, 0) AS thread_count,
  COALESCE(role_grants, '{}') AS role_grants
FROM forum_sections
  LEFT OUTER JOIN _thread_count USING (forum_section_id)
  LEFT OUTER JOIN _role_grants USING (forum_section_id);
