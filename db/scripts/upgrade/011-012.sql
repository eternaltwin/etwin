COMMENT ON SCHEMA public IS '{"version": 12}';

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE DOMAIN password_hash AS bytea;
CREATE DOMAIN email_address_enc AS bytea;
CREATE DOMAIN email_address_hash AS bytea;
CREATE DOMAIN email_address AS text;

CREATE TYPE PERIOD AS RANGE (
  subtype = INSTANT
);

CREATE DOMAIN PERIOD_FROM AS PERIOD CHECK (NOT lower_inf(VALUE) AND lower_inc(VALUE) AND NOT upper_inc(VALUE));

CREATE TABLE email_addresses(
  email_address EMAIL_ADDRESS_ENC NOT NULL,
  _hash EMAIL_ADDRESS_HASH NOT NULL,
  created_at INSTANT NOT NULL,
  PRIMARY KEY (_hash)
);

-- Transaction-time state table for time-varying `users` fields.
CREATE TABLE users_history(
  user_id USER_ID NOT NULL,
  period PERIOD_FROM NOT NULL,
  -- `NULL`: not current, `TRUE`: current
  _is_current BOOLEAN NULL,
  updated_by USER_ID NOT NULL,
  display_name USER_DISPLAY_NAME NOT NULL,
  username USERNAME NULL,
  email EMAIL_ADDRESS_HASH NULL,
  password PASSWORD_HASH NULL,
  PRIMARY KEY (user_id, period),
  CHECK ((NOT upper_inf(period) AND _is_current IS NULL) OR (upper_inf(period) AND _is_current IS NOT NULL AND _is_current)),
  UNIQUE (user_id, _is_current),
  -- No overlapping rows for a given user
  EXCLUDE USING gist (user_id WITH =, period WITH &&),
  -- Sequential username uniqueness
  EXCLUDE USING gist (username WITH =, period WITH &&),
  EXCLUDE USING gist (email WITH =, period WITH &&),
  CONSTRAINT user_history_user_id__fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT user_history_updated_by__fk FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT user_history_email__fk FOREIGN KEY (email) REFERENCES email_addresses(_hash) ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO users_history(user_id, period, _is_current, updated_by, display_name, username, email, password)
SELECT user_id, PERIOD(ctime, NULL), TRUE, user_id, display_name, username, NULL, password
FROM users;

ALTER TABLE users
  DROP COLUMN display_name,
  DROP COLUMN display_name_mtime,
  DROP COLUMN email_address,
  DROP COLUMN email_address_mtime,
  DROP COLUMN username,
  DROP COLUMN username_mtime,
  DROP COLUMN password,
  DROP COLUMN password_mtime;

ALTER TABLE users RENAME COLUMN ctime TO created_at;

ALTER TABLE users ALTER COLUMN user_id TYPE USER_ID;

ALTER TABLE users ADD COLUMN _is_current BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
  ADD CHECK (_is_current),
  ADD CONSTRAINT users_history__fk FOREIGN KEY (user_id, _is_current) REFERENCES users_history(user_id, _is_current) ON DELETE RESTRICT ON UPDATE NO ACTION DEFERRABLE INITIALLY DEFERRED;

CREATE VIEW users_current AS
  SELECT user_id, users.created_at, lower(period) AS updated_at, updated_by, is_administrator, display_name, username, email_addresses.email_address AS email, users_history.email AS _email_hash, password
  FROM users INNER JOIN users_history USING (user_id, _is_current) LEFT OUTER JOIN email_addresses ON users_history.email = email_addresses._hash
