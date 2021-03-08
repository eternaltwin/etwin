COMMENT ON SCHEMA public IS '{"version": 14}';

CREATE DOMAIN valid_period AS PERIOD CHECK (NOT LOWER_INF(value) AND NOT UPPER_INF(value));

CREATE DOMAIN i8 AS INT2 CHECK (-128 <= value AND value < 128);
CREATE DOMAIN u8 AS INT2 CHECK (0 <= value AND value < 256);
CREATE DOMAIN i16 AS INT2;
CREATE DOMAIN u16 AS INT4 CHECK (0 <= value AND value < 65536);
CREATE DOMAIN i32 AS INT4;
CREATE DOMAIN u32 AS INT8 CHECK (0 <= value AND value < 4294967296);
CREATE DOMAIN i64 AS INT8;

CREATE DOMAIN hammerfest_item_count_map_id AS UUID;
CREATE DOMAIN hammerfest_quest_status_map_id AS UUID;
CREATE DOMAIN hammerfest_unlocked_item_set_id AS UUID;

CREATE DOMAIN hammerfest_theme_id AS VARCHAR(10) CHECK (value ~ '^[1-9]\d{0,9}$');
CREATE DOMAIN hammerfest_thread_id AS VARCHAR(10) CHECK (value ~ '^[1-9]\d{0,9}$');
CREATE DOMAIN hammerfest_message_id AS VARCHAR(10) CHECK (value ~ '^[1-9]\d{0,9}$');
CREATE DOMAIN hammerfest_item_id AS VARCHAR(4) CHECK (value ~ '^(?:0|[1-9]\d{0,3})$');
CREATE DOMAIN hammerfest_quest_id AS VARCHAR(4) CHECK (value ~ '^(?:0|[1-9]\d{0,3})$');
-- Pyramid rank: 0 (Hall of Fame) to 4 (Level 4).
CREATE DOMAIN hammerfest_rank AS U8 CHECK (value < 5);
CREATE DOMAIN hammerfest_theme_title AS VARCHAR(100);
CREATE DOMAIN hammerfest_thread_title AS VARCHAR(100);

--- Checks that arr is ascendingly-sorted array of unique non-null values
CREATE OR REPLACE FUNCTION array_is_ordered_set(
  IN arr ANYARRAY
) RETURNS BOOLEAN
  LANGUAGE sql
  IMMUTABLE LEAKPROOF STRICT PARALLEL SAFE AS
$$
SELECT arr = (
  SELECT ARRAY_AGG(item)
  FROM (
    SELECT DISTINCT UNNEST(arr) AS item
    ORDER BY item ASC
  ) AS items
  WHERE item IS NOT NULL
);
$$;

--- Checks that arr is ascendingly-sorted array of unique non-null instants with at most 2 instants in any period of duration `sampling_window`
CREATE OR REPLACE FUNCTION array_is_sampled_instant_set(
  IN arr INSTANT ARRAY,
  IN sampling_window INTERVAL
) RETURNS BOOLEAN
  LANGUAGE sql
  IMMUTABLE LEAKPROOF STRICT PARALLEL SAFE AS
$$
SELECT
  array_is_ordered_set(arr)
  AND (
    SELECT MAX(sample_count_in_window) FROM (
      SELECT COUNT(item) OVER (ORDER BY item RANGE sampling_window PRECEDING) AS sample_count_in_window
      FROM (SELECT UNNEST(arr) AS item) AS items
    ) AS counts
  ) <= 2;
$$;

--- Insert a value at the end of a `samplied_instant_set`, see `array_is_sampled_instant_set`
CREATE OR REPLACE FUNCTION sampled_instant_set_insert_back(
  IN arr INSTANT ARRAY,
  IN sampling_window INTERVAL,
  IN new_value INSTANT
) RETURNS INSTANT ARRAY
  LANGUAGE sql
  IMMUTABLE LEAKPROOF STRICT PARALLEL SAFE AS
$$
SELECT CASE
  WHEN array_length(arr, 1) = 0 THEN ARRAY[new_value]
  WHEN array_length(arr, 1) = 1 AND arr[1] <> new_value THEN arr || new_value
  WHEN array_length(arr, 1) >= 1 AND arr[array_length(arr, 1)] = new_value THEN arr
  WHEN array_length(arr, 1) >= 2 AND new_value - arr[array_length(arr, 1) - 1] < sampling_window THEN arr[1:array_length(arr, 1) - 1] || new_value
  ELSE arr || new_value
END
$$;

-- Ordered set of instants, such as for each period of time T, there are at most 2 values
-- Where `T` depen
CREATE DOMAIN sampled_instant_set AS INSTANT ARRAY CHECK (array_is_ordered_set(VALUE));

CREATE TYPE HAMMERFEST_FORUM_ROLE AS ENUM ('User', 'Moderator', 'Administrator');
CREATE TYPE HAMMERFEST_QUEST_STATUS AS ENUM ('None', 'Pending', 'Complete');

CREATE TYPE RAW_HAMMERFEST_DATE AS (
  -- 1-12
  month U8,
  -- 1-31
  day U8,
  -- Day of week: Monday(1) to Sunday(7)
  isodow U8
);

CREATE DOMAIN hammerfest_date AS RAW_HAMMERFEST_DATE CHECK ( (value).month IS NOT NULL AND 1 <= (value).month AND (value).month <= 12 AND (value).day IS NOT NULL AND 1 <= (value).day
  AND (value).day <= 31 AND (value).isodow IS NOT NULL AND 1 <= (value).isodow AND (value).isodow <= 7 );

CREATE TYPE RAW_HAMMERFEST_DATETIME AS (
  -- 1-12
  month U8,
  -- 1-31
  day U8,
  -- Day of week: Monday(1) to Sunday(7)
  isodow U8,
  -- 0-23
  hour U8,
  -- 0-59
  minute U8
);

CREATE DOMAIN hammerfest_datetime AS RAW_HAMMERFEST_DATETIME CHECK ( (value).month IS NOT NULL AND 1 <= (value).month AND (value).month <= 12 AND (value).day IS NOT NULL AND 1 <= (value).day
  AND (value).day <= 31 AND (value).isodow IS NOT NULL AND 1 <= (value).isodow AND (value).isodow <= 7 AND (value).hour IS NOT NULL AND 1 <= (value).hour AND (value).hour <= 23
  AND (value).minute IS NOT NULL AND 1 <= (value).minute AND (value).minute <= 59 );

-- The list of items in Hammerfest (official game)
CREATE TABLE hammerfest_items (
  hammerfest_item_id HAMMERFEST_ITEM_ID NOT NULL,
  is_hidden BOOLEAN NOT NULL,
  PRIMARY KEY (hammerfest_item_id)
);

-- Global constant: sampling window size for sampled instant sets
CREATE OR REPLACE FUNCTION const_sampling_window() RETURNS INTERVAL
  LANGUAGE sql
  IMMUTABLE LEAKPROOF STRICT PARALLEL SAFE AS
$$
  SELECT '1day'::INTERVAL
$$;

-- The list of quests in Hammerfest (official game)
CREATE TABLE hammerfest_quests (
  hammerfest_quest_id HAMMERFEST_QUEST_ID NOT NULL,
  PRIMARY KEY (hammerfest_quest_id)
);

-- Immutable quest status maps (may be shared by different users)
CREATE TABLE hammerfest_quest_status_maps (
  hammerfest_quest_status_map_id HAMMERFEST_QUEST_STATUS_MAP_ID NOT NULL,
-- sha3_256(utf8(json(value)))
-- Where `value` is a map from the id to the status, sorted by id and json does not use any whitespace
-- {"0":"None","1":"Pending",2:"Complete"}
  _sha3_256 BYTEA NOT NULL,
  PRIMARY KEY (hammerfest_quest_status_map_id),
  UNIQUE (_sha3_256)
);

-- Content of hammerfest_quest_status_maps
CREATE TABLE hammerfest_quest_status_map_items (
  hammerfest_quest_status_map_id HAMMERFEST_QUEST_STATUS_MAP_ID NOT NULL,
  hammerfest_quest_id HAMMERFEST_QUEST_ID NOT NULL,
  status HAMMERFEST_QUEST_STATUS NOT NULL,
  PRIMARY KEY (hammerfest_quest_status_map_id, hammerfest_quest_id),
  CONSTRAINT hammerfest_quest_status_map_item__map__fk FOREIGN KEY (hammerfest_quest_status_map_id) REFERENCES hammerfest_quest_status_maps(hammerfest_quest_status_map_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_quest_status_map_item__quest__fk FOREIGN KEY (hammerfest_quest_id) REFERENCES hammerfest_quests(hammerfest_quest_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Immutable unlocked items state (may be shared by different users)
CREATE TABLE hammerfest_unlocked_item_sets (
  hammerfest_unlocked_item_set_id HAMMERFEST_UNLOCKED_ITEM_SET_ID NOT NULL,
-- sha3_256(utf8(json(value)))
-- Where `value` is a sorted list of item ids and json does not use any whitespace
-- [0,2,100]
  _sha3_256 BYTEA NOT NULL,
  PRIMARY KEY (hammerfest_unlocked_item_set_id),
  UNIQUE (_sha3_256)
);

-- Content of hammerfest_unlocked_items_snapshots
CREATE TABLE hammerfest_unlocked_item_set_items (
  hammerfest_unlocked_item_set_id HAMMERFEST_UNLOCKED_ITEM_SET_ID NOT NULL,
  hammerfest_item_id HAMMERFEST_ITEM_ID NOT NULL,
  PRIMARY KEY (hammerfest_unlocked_item_set_id, hammerfest_item_id),
  CONSTRAINT hammerfest_unlocked_item_set_item__map__fk FOREIGN KEY (hammerfest_unlocked_item_set_id) REFERENCES hammerfest_unlocked_item_sets(hammerfest_unlocked_item_set_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_unlocked_item_set_item__item__fk FOREIGN KEY (hammerfest_item_id) REFERENCES hammerfest_items(hammerfest_item_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Immutable item counts (may be shared by different users)
CREATE TABLE hammerfest_item_count_maps (
  hammerfest_item_count_map_id HAMMERFEST_ITEM_COUNT_MAP_ID NOT NULL,
-- sha3_256(utf8(json(value)))
-- Where `value` is a map from the item id to the count, sorted by id and json does not use any whitespace
-- {"0":0,"2":9,2:5}
  _sha3_256 BYTEA NOT NULL,
  PRIMARY KEY (hammerfest_item_count_map_id),
  UNIQUE (_sha3_256)
);

-- Content of hammerfest_quest_statuses_snapshots
CREATE TABLE hammerfest_item_count_map_items (
  hammerfest_item_count_map_id HAMMERFEST_ITEM_COUNT_MAP_ID NOT NULL,
  hammerfest_item_id HAMMERFEST_ITEM_ID NOT NULL,
  count U32 NOT NULL,
  PRIMARY KEY (hammerfest_item_count_map_id, hammerfest_item_id),
  CONSTRAINT hammerfest_item_count_map_item__map__fk FOREIGN KEY (hammerfest_item_count_map_id) REFERENCES hammerfest_item_count_maps(hammerfest_item_count_map_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_item_count_map_item__item__fk FOREIGN KEY (hammerfest_item_id) REFERENCES hammerfest_items(hammerfest_item_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data for hammerfest inventories
CREATE TABLE hammerfest_inventories (
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
  valid_period VALID_PERIOD NOT NULL,
--
  item_counts HAMMERFEST_ITEM_COUNT_MAP_ID NOT NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_user_id, valid_period),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, valid_period WITH &&),
  CONSTRAINT hammerfest_inventory__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_inventory__item_counts__fk FOREIGN KEY (item_counts) REFERENCES hammerfest_item_count_maps(hammerfest_item_count_map_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data unique to the public profile
CREATE TABLE hammerfest_profiles (
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
  period PERIOD_FROM NOT NULL,
  retrieved_at sampled_instant_set NOT NULL CHECK(array_is_sampled_instant_set(retrieved_at, const_sampling_window())),
--
  best_score U32 NOT NULL,
  best_level U8 NOT NULL CHECK (best_level < 120),
-- Null if not played
  season_score U32 NULL,
  quest_statuses HAMMERFEST_QUEST_STATUS_MAP_ID NOT NULL,
  unlocked_items HAMMERFEST_UNLOCKED_ITEM_SET_ID NOT NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_user_id, period),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, period WITH &&),
  CONSTRAINT hammerfest_profiles__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_profiles__quest_statuses__fk FOREIGN KEY (quest_statuses) REFERENCES hammerfest_quest_status_maps(hammerfest_quest_status_map_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_profiles__unlocked_items__fk FOREIGN KEY (unlocked_items) REFERENCES hammerfest_unlocked_item_sets(hammerfest_unlocked_item_set_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant linked email
CREATE TABLE hammerfest_emails (
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
  period PERIOD_FROM NOT NULL,
  retrieved_at sampled_instant_set NOT NULL CHECK(array_is_sampled_instant_set(retrieved_at, const_sampling_window())),
--
  email EMAIL_ADDRESS_HASH NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_user_id, period),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, period WITH &&),
  EXCLUDE USING gist (hammerfest_server WITH =, email WITH =, period WITH &&),
  CONSTRAINT hammerfest_email__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_email__email__fk FOREIGN KEY (email) REFERENCES email_addresses(_hash) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data shared by the public profile and forum author
CREATE TABLE hammerfest_user_ranks (
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
  valid_period VALID_PERIOD NOT NULL,
--
  has_carrot BOOLEAN NOT NULL,
  rank HAMMERFEST_RANK NOT NULL,
--   Null if no game played during this season
  season_rank U32 NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_user_id, valid_period),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, valid_period WITH &&),
  CONSTRAINT hammerfest_user_ranks__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data unique to the forum author
CREATE TABLE hammerfest_forum_roles (
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
  valid_period VALID_PERIOD NOT NULL,
--
  role HAMMERFEST_FORUM_ROLE NOT NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_user_id, valid_period),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, valid_period WITH &&),
  CONSTRAINT hammerfest_user_ranks__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data unique to the shop
CREATE TABLE hammerfest_shop_history (
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
  valid_period VALID_PERIOD NOT NULL,
--
  weekly_tokens U8 NOT NULL,
--   0-249 is exact, 250 or more is represented with NULL (inf)
  purchased_tokens U8 NULL,
  has_quest_bonus BOOL NOT NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_user_id, valid_period),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, valid_period WITH &&),
  CONSTRAINT hammerfest_shop_history__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant game tokens
CREATE TABLE hammerfest_tokens (
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
  valid_period VALID_PERIOD NOT NULL,
--
  tokens U32 NOT NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_user_id, valid_period),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, valid_period WITH &&),
  CONSTRAINT hammerfest_tokens__user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE

);

-- Time-variant Hammerfest godfather links
CREATE TABLE hammerfest_godfathers (
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
  valid_period VALID_PERIOD NOT NULL,
--
  godfather_id HAMMERFEST_USER_ID NOT NULL,
-- Tokens granted to the godfather
  tokens U32 NOT NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_user_id, valid_period),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_user_id WITH =, valid_period WITH &&),
  CONSTRAINT hammerfest_godfathers__child__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_godfathers__father__fk FOREIGN KEY (hammerfest_server, godfather_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Permanent data for forum themes
CREATE TABLE hammerfest_forum_themes (
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_theme_id HAMMERFEST_THEME_ID NOT NULL,
--
  title HAMMERFEST_THEME_TITLE NOT NULL,
  is_public BOOLEAN NOT NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_theme_id),
  CONSTRAINT hammerfest_forum_themes__servers__fk FOREIGN KEY (hammerfest_server) REFERENCES hammerfest_servers(hammerfest_server) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Permanent data for forum threads
CREATE TABLE hammerfest_forum_threads (
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_thread_id HAMMERFEST_THREAD_ID NOT NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_thread_id),
  CONSTRAINT hammerfest_forum_threads__servers__fk FOREIGN KEY (hammerfest_server) REFERENCES hammerfest_servers(hammerfest_server) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data for forum threads
CREATE TABLE hammerfest_forum_threads_history (
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_thread_id HAMMERFEST_THREAD_ID NOT NULL,
  valid_period VALID_PERIOD NOT NULL,
--
  hammerfest_theme_id HAMMERFEST_THEME_ID NOT NULL,
  title HAMMERFEST_THREAD_TITLE NOT NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_thread_id, valid_period),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_thread_id WITH =, valid_period WITH &&),
  CONSTRAINT hammerfest_threads_history__theme__fk FOREIGN KEY (hammerfest_server, hammerfest_theme_id) REFERENCES hammerfest_forum_themes(hammerfest_server, hammerfest_theme_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data for forum messages
CREATE TABLE hammerfest_forum_messages_history (
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_thread_id HAMMERFEST_THREAD_ID NOT NULL,
  page U16 NOT NULL,
  offset_in_page U8 NOT NULL,
  valid_period VALID_PERIOD NOT NULL,
--
  author HAMMERFEST_USER_ID NOT NULL,
  posted_at HAMMERFEST_DATE NOT NULL,
  -- Raw HTML content as found on the remote website
  remote_html_body TEXT NOT NULL,
  -- Marktwin body
  _mkt_body TEXT NULL,
  -- Rendered Marktwin body
  _html_body TEXT NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_thread_id, page, offset_in_page, valid_period),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_thread_id WITH =, page WITH =, offset_in_page WITH =, valid_period WITH &&),
  CONSTRAINT hammerfest_messages_history__thread__fk FOREIGN KEY (hammerfest_server, hammerfest_thread_id) REFERENCES hammerfest_forum_threads(hammerfest_server, hammerfest_thread_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_messages_history__author__fk FOREIGN KEY (hammerfest_server, author) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Time-variant data for message-position/message id relationship
CREATE TABLE hammerfest_forum_message_ids (
  hammerfest_server HAMMERFEST_SERVER NOT NULL,
  hammerfest_thread_id HAMMERFEST_THREAD_ID NOT NULL,
  page U16 NOT NULL,
  offset_in_page U8 NOT NULL,
  valid_period VALID_PERIOD NOT NULL,
--
  hammerfest_message_id HAMMERFEST_MESSAGE_ID NOT NULL,
  PRIMARY KEY (hammerfest_server, hammerfest_thread_id, page, offset_in_page, valid_period),
  EXCLUDE USING gist (hammerfest_server WITH =, hammerfest_thread_id WITH =, page WITH =, offset_in_page WITH =, valid_period WITH &&),
  CONSTRAINT hammerfest_messages_history__thread__fk FOREIGN KEY (hammerfest_server, hammerfest_thread_id) REFERENCES hammerfest_forum_threads(hammerfest_server, hammerfest_thread_id) ON DELETE RESTRICT ON UPDATE CASCADE
);
