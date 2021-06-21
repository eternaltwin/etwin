DROP TABLE hammerfest_tokens;
DROP TABLE hammerfest_profiles;
DROP TABLE hammerfest_emails;
DROP TABLE hammerfest_best_season_rank;
DROP TABLE hammerfest_user_achievements;
DROP TABLE hammerfest_forum_roles;
DROP TABLE hammerfest_shop_history;
DROP TABLE hammerfest_godfathers;
DROP TABLE hammerfest_forum_theme_page_counts;
DROP TABLE hammerfest_forum_thread_list_meta;
DROP TABLE hammerfest_forum_thread_shared_meta;
DROP TABLE hammerfest_forum_messages_history;
DROP TABLE hammerfest_forum_message_ids;
DROP TABLE hammerfest_inventories;

ALTER DOMAIN hammerfest_forum_message_id RENAME TO hammerfest_forum_post_id;
ALTER DOMAIN PERIOD_FROM RENAME TO PERIOD_LOWER;

DROP DOMAIN valid_period;
DROP DOMAIN hammerfest_date;

CREATE DOMAIN hammerfest_date AS raw_hammerfest_date CHECK (
  value IS NULL OR ((value).month IS NOT NULL AND (value).day IS NOT NULL AND (value).isodow IS NOT NULL)
);

DROP DOMAIN hammerfest_datetime;

ALTER TYPE raw_hammerfest_datetime RENAME TO raw_hammerfest_date_time;

CREATE DOMAIN hammerfest_date_time AS RAW_HAMMERFEST_DATE_TIME CHECK (
  value IS NULL OR (
  (value).month IS NOT NULL AND 1 <= (value).month
  AND (value).month <= 12 AND (value).day IS NOT NULL AND 1 <= (value).day AND (value).day <= 31
  AND (value).isodow IS NOT NULL AND 1 <= (value).isodow AND (value).isodow <= 7 AND (value).hour IS NOT NULL
  AND 0 <= (value).hour AND (value).hour <= 23 AND (value).minute IS NOT NULL AND 0 <= (value).minute
  AND (value).minute <= 59
));

DROP DOMAIN sampled_instant_set;
CREATE DOMAIN instant_set AS INSTANT ARRAY CHECK (array_is_ordered_set(value));

--- Insert a value to an ordered set
CREATE OR REPLACE FUNCTION ordered_set_insert(
  IN arr ANYARRAY,
  IN new_value ANYELEMENT
) RETURNS ANYARRAY
  LANGUAGE sql
  IMMUTABLE STRICT PARALLEL SAFE AS
$$
SELECT ARRAY_AGG(item)
FROM (
  SELECT DISTINCT UNNEST(array_append(arr, new_value)) AS item
  ORDER BY item ASC
) AS items;
$$;

-- Time-variant game tokens <any(logged)>
CREATE TABLE hammerfest_tokens (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
--
  tokens U32 NOT NULL,
  PRIMARY KEY (period, hammerfest_server, hammerfest_user_id),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_tokens__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data unique to the shop <shop>
CREATE TABLE hammerfest_shops (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
--
  weekly_tokens U8 NOT NULL,
--   0-249 is exact, 250 or more is represented with NULL (inf)
  purchased_tokens U8 NULL,
  has_quest_bonus BOOL NOT NULL,
  PRIMARY KEY (period, hammerfest_server, hammerfest_user_id),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_shops__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant Hammerfest godchild list meta <godChildren>
CREATE TABLE hammerfest_godchild_lists (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
--
  godchild_count U32 NOT NULL,
  PRIMARY KEY (period, hammerfest_server, hammerfest_user_id),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_godchild_lists__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant Hammerfest godchild list items (<godChildren>)
CREATE TABLE hammerfest_godchildren (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
  offset_in_list U32 NOT NULL,
--
  godchild_id HAMMERFEST_USER_ID NOT NULL,
-- Tokens granted to the godfather
  tokens U32 NOT NULL,
  PRIMARY KEY (period, hammerfest_server, hammerfest_user_id, offset_in_list),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, offset_in_list WITH =, period WITH &&),
  EXCLUDE USING gist (hammerfest_server WITH =, godchild_id WITH =, period WITH &&),
  CHECK (godchild_id <> hammerfest_godchildren.hammerfest_user_id),
  CONSTRAINT hammerfest_godchildren__father__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_godchildren__child__fk FOREIGN KEY (hammerfest_server, godchild_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data unique to the public profile <profile>
CREATE TABLE hammerfest_profiles (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
--
  best_score U32 NOT NULL,
  best_level U8 NOT NULL CHECK (best_level < 120),
-- Null if not played
  season_score U32 NULL,
  quest_statuses HAMMERFEST_QUEST_STATUS_MAP_ID NOT NULL,
  unlocked_items HAMMERFEST_UNLOCKED_ITEM_SET_ID NOT NULL,
  PRIMARY KEY (period, hammerfest_server, hammerfest_user_id),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_profiles__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_profiles__quest_statuses__fk FOREIGN KEY (quest_statuses) REFERENCES hammerfest_quest_status_maps(hammerfest_quest_status_map_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_profiles__unlocked_items__fk FOREIGN KEY (unlocked_items) REFERENCES hammerfest_unlocked_item_sets(hammerfest_unlocked_item_set_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant linked email <profile(logged)>
CREATE TABLE hammerfest_emails (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
--
  email EMAIL_ADDRESS_HASH NULL,
  PRIMARY KEY (period, hammerfest_server, hammerfest_user_id),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, period WITH &&),
  EXCLUDE USING gist (hammerfest_server WITH =, email WITH =, period WITH &&),
  CONSTRAINT hammerfest_email__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_email__email__fk FOREIGN KEY (email) REFERENCES email_addresses(_hash) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data shared by the public profile and forum author <profile + forumThread>
CREATE TABLE hammerfest_user_achievements (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
--
  has_carrot BOOLEAN NOT NULL,
  ladder_level HAMMERFEST_LADDER_LEVEL NOT NULL,
  PRIMARY KEY (period, hammerfest_server, hammerfest_user_id),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_user_achievements__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data for hammerfest inventories <inventory>
CREATE TABLE hammerfest_inventories (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
--
  item_counts HAMMERFEST_ITEM_COUNT_MAP_ID NOT NULL,
  PRIMARY KEY (period, hammerfest_server, hammerfest_user_id),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_inventory__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_inventory__item_counts__fk FOREIGN KEY (item_counts) REFERENCES hammerfest_item_count_maps(hammerfest_item_count_map_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant page count (in a theme page, number of pages for the thread list) <forumTheme>
CREATE TABLE hammerfest_forum_theme_counts (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_theme_id HAMMERFEST_FORUM_THREAD_ID NOT NULL,
--
  page_count U16 NOT NULL CHECK (page_count > 0),
  PRIMARY KEY (period, hammerfest_server, hammerfest_theme_id),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_theme_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_forum_theme_counts__theme__fk FOREIGN KEY (hammerfest_server, hammerfest_theme_id) REFERENCES hammerfest_forum_themes(hammerfest_server, hammerfest_theme_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant counts of regular threads in a page <forumTheme>
CREATE TABLE hammerfest_forum_theme_page_counts (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_theme_id HAMMERFEST_FORUM_THREAD_ID NOT NULL,
-- Page 0 is the sticky thread list, page >= 1  is a regular thread list
  page U16 NOT NULL,
--
  thread_count U8 NOT NULL,
  PRIMARY KEY (period, hammerfest_server, hammerfest_theme_id, page),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_theme_id WITH =, page WITH =, period WITH &&),
  CONSTRAINT hammerfest_forum_theme_page_counts__themes__fk FOREIGN KEY (hammerfest_server, hammerfest_theme_id) REFERENCES hammerfest_forum_themes(hammerfest_server, hammerfest_theme_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant regular thread list items <forumTheme>
CREATE TABLE hammerfest_forum_theme_threads (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_theme_id HAMMERFEST_FORUM_THREAD_ID NOT NULL,
-- Page 0 is the sticky thread list, page >= 1  is a regular thread list
  page U16 NOT NULL,
  offset_in_list U8 NOT NULL,
--
  hammerfest_thread_id HAMMERFEST_FORUM_THREAD_ID NOT NULL,
  PRIMARY KEY (period, hammerfest_server, hammerfest_theme_id, page, offset_in_list),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_theme_id WITH =, page WITH =, offset_in_list WITH =, period WITH &&),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_thread_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_forum_theme_threads__theme__fk FOREIGN KEY (hammerfest_server, hammerfest_theme_id) REFERENCES hammerfest_forum_themes(hammerfest_server, hammerfest_theme_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_forum_theme_threads__thread__fk FOREIGN KEY (hammerfest_server, hammerfest_thread_id) REFERENCES hammerfest_forum_threads(hammerfest_server, hammerfest_thread_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant meta for forum threads unique to the thread list <forumTheme>
CREATE TABLE hammerfest_forum_thread_theme_meta (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_thread_id HAMMERFEST_FORUM_THREAD_ID NOT NULL,
--
  is_sticky BOOLEAN NOT NULL,
  latest_post_at HAMMERFEST_DATE NULL,
  author HAMMERFEST_USER_ID NOT NULL,
  reply_count U16 NOT NULL,
  CHECK ((is_sticky AND latest_post_at IS NULL) OR (NOT is_sticky AND latest_post_at IS NOT NULL)),
  PRIMARY KEY (period, hammerfest_server, hammerfest_thread_id),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_thread_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_forum_thread_theme_meta__thread__fk FOREIGN KEY (hammerfest_server, hammerfest_thread_id) REFERENCES hammerfest_forum_threads(hammerfest_server, hammerfest_thread_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant meta for forum threads, shared by the thread list and thread page <forumTheme + forumThread>
CREATE TABLE hammerfest_forum_thread_shared_meta (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_thread_id HAMMERFEST_FORUM_THREAD_ID NOT NULL,
--
  hammerfest_theme_id HAMMERFEST_FORUM_THEME_ID NOT NULL,
  title HAMMERFEST_FORUM_THREAD_TITLE NOT NULL,
  is_closed BOOLEAN NOT NULL,
  page_count U32 NOT NULL CHECK (page_count > 0),
  PRIMARY KEY (period, hammerfest_server, hammerfest_thread_id),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_thread_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_forum_thread_shared_meta__thread__fk FOREIGN KEY (hammerfest_server, hammerfest_thread_id) REFERENCES hammerfest_forum_threads(hammerfest_server, hammerfest_thread_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_forum_thread_shared_meta__theme__fk FOREIGN KEY (hammerfest_server, hammerfest_theme_id) REFERENCES hammerfest_forum_themes(hammerfest_server, hammerfest_theme_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant meta for forum threads, shared by the thread list and thread page <forumTheme + forumThread>
CREATE TABLE hammerfest_forum_roles (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
--
  role HAMMERFEST_FORUM_ROLE NOT NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_user_id, period),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_forum_roles__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant post counts for a thread page <threadPage>
CREATE TABLE hammerfest_forum_thread_page_counts (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_thread_id HAMMERFEST_FORUM_THREAD_ID NOT NULL,
  page U16 NOT NULL CHECK (page > 0),
--
  post_count U8 NOT NULL,
  PRIMARY KEY (period, hammerfest_server, hammerfest_thread_id, page),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_thread_id WITH =, page WITH =, period WITH &&),
  CONSTRAINT hammerfest_forum_thread_page_counts__thread__fk FOREIGN KEY (hammerfest_server, hammerfest_thread_id) REFERENCES hammerfest_forum_threads(hammerfest_server, hammerfest_thread_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data for forum posts <threadPage>
CREATE TABLE hammerfest_forum_posts (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_thread_id HAMMERFEST_FORUM_THREAD_ID NOT NULL,
  page U16 NOT NULL CHECK (page > 0),
  offset_in_list U8 NOT NULL,
--
  author HAMMERFEST_USER_ID NOT NULL,
  posted_at HAMMERFEST_DATE_TIME NOT NULL,
  -- Raw HTML content as found on the remote website
  remote_html_body TEXT NOT NULL,
  -- Marktwin body
  _mkt_body TEXT NULL,
  -- Rendered Marktwin body
  _html_body TEXT NULL,
  PRIMARY KEY (period, hammerfest_server, hammerfest_thread_id, page, offset_in_list),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_thread_id WITH =, page WITH =, offset_in_list WITH =, period WITH &&),
  CONSTRAINT hammerfest_forum_posts__thread__fk FOREIGN KEY (hammerfest_server, hammerfest_thread_id) REFERENCES hammerfest_forum_threads(hammerfest_server, hammerfest_thread_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_forum_posts__author__fk FOREIGN KEY (hammerfest_server, author) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data for post-position/post id relationship <threadPage>
CREATE TABLE hammerfest_forum_post_ids (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_thread_id HAMMERFEST_FORUM_THREAD_ID NOT NULL,
  page U16 NOT NULL CHECK (page > 0),
  offset_in_list U8 NOT NULL,
--
  hammerfest_post_id HAMMERFEST_FORUM_POST_ID NOT NULL,
  PRIMARY KEY (period, hammerfest_server, hammerfest_thread_id, page, offset_in_list),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_thread_id WITH =, page WITH =, offset_in_list WITH =, period WITH &&),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_post_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_forum_post_ids__thread__fk FOREIGN KEY (hammerfest_server, hammerfest_thread_id) REFERENCES hammerfest_forum_threads(hammerfest_server, hammerfest_thread_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant best season rank, as displayed on the forum <threadPage>
CREATE TABLE hammerfest_best_season_ranks (
  period PERIOD_LOWER NOT NULL,
  retrieved_at INSTANT_SET NOT NULL,
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
--
--   Null if the forum displayed `--`
  best_season_rank U32 NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_user_id, period),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_best_season_rank__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);
