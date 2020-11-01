COMMENT ON SCHEMA public IS '{"version": 5}';

CREATE DOMAIN dinoparc_server AS VARCHAR(15) CHECK (value IN ('dinoparc.com', 'en.dinoparc.com', 'sp.dinoparc.com'));
CREATE DOMAIN dinoparc_session_key AS VARCHAR(32) CHECK (value ~ '^[0-9a-zA-Z]{32}$');
CREATE DOMAIN dinoparc_user_id AS VARCHAR(10) CHECK (value ~ '^[1-9]\d{0,9}$');
CREATE DOMAIN dinoparc_username AS VARCHAR(20);
CREATE DOMAIN user_id AS UUID;

-- Known Dinoparc servers
CREATE TABLE public.dinoparc_servers (
  -- Domain name for the Dinoparc server
  dinoparc_server DINOPARC_SERVER PRIMARY KEY NOT NULL
);

-- Known Dinoparc users
CREATE TABLE public.dinoparc_users (
  -- Dinoparc server
  dinoparc_server DINOPARC_SERVER NOT NULL,
  -- User ID on the Dinoparc server
  dinoparc_user_id DINOPARC_USER_ID NOT NULL,
  -- Dinoparc username
  username DINOPARC_USERNAME NOT NULL,
  PRIMARY KEY (dinoparc_server, dinoparc_user_id),
  CONSTRAINT dinoparc_user__dinoparc_server__fk FOREIGN KEY (dinoparc_server) REFERENCES dinoparc_servers(dinoparc_server) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE (dinoparc_server, username)
);

-- Active links between Eternal-Twin and Dinoparc users
CREATE TABLE public.dinoparc_user_links (
  -- Eternal-Twin user id
  user_id USER_ID NOT NULL,
  -- Dinoparc server
  dinoparc_server DINOPARC_SERVER NOT NULL,
  -- User ID on the Dinoparc server
  dinoparc_user_id DINOPARC_USER_ID NOT NULL,
  -- Link creation time
  linked_at INSTANT NOT NULL,
  -- Link creation author
  linked_by USER_ID NOT NULL,
  PRIMARY KEY (user_id, dinoparc_server, dinoparc_user_id),
  -- An Eternal-Twin user can only be linked to one dinoparc user per server
  UNIQUE (user_id, dinoparc_server),
  -- A Dinoparc user can only be linked to one Eternal-Twin user
  UNIQUE (dinoparc_server, dinoparc_user_id),
  CONSTRAINT dinoparc_user_link__user__fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT dinoparc_user_link_linked_by__user__fk FOREIGN KEY (linked_by) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT dinoparc_user_link__dinoparc_user__fk FOREIGN KEY (dinoparc_server, dinoparc_user_id) REFERENCES dinoparc_users(dinoparc_server, dinoparc_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Active Dinoparc sessions
CREATE TABLE public.dinoparc_sessions (
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_session_key BYTEA NOT NULL,
  _dinoparc_session_key_hash BYTEA NOT NULL,
  dinoparc_user_id DINOPARC_USER_ID NOT NULL,
  -- Session creation time
  ctime INSTANT NOT NULL,
  -- Session access time
  atime INSTANT NOT NULL,
  CHECK (atime >= ctime),
  PRIMARY KEY (dinoparc_server, _dinoparc_session_key_hash),
  UNIQUE (dinoparc_server, dinoparc_user_id),
  CONSTRAINT dinoparc_session__dinoparc_user__fk FOREIGN KEY (dinoparc_server, dinoparc_user_id) REFERENCES dinoparc_users(dinoparc_server, dinoparc_user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Revoked Dinoparc sessions
CREATE TABLE public.old_dinoparc_sessions (
  dinoparc_server DINOPARC_SERVER NOT NULL,
  dinoparc_session_key BYTEA NOT NULL,
  _dinoparc_session_key_hash BYTEA NOT NULL,
  dinoparc_user_id DINOPARC_USER_ID NOT NULL,
  -- Session creation time
  ctime INSTANT NOT NULL,
  -- Session access time
  atime INSTANT NOT NULL,
  -- Session deletion time
  dtime INSTANT NOT NULL,
  CHECK (atime >= ctime),
  CHECK (dtime >= atime),
  CHECK (dtime > ctime),
  PRIMARY KEY (dinoparc_server, _dinoparc_session_key_hash, ctime),
  CONSTRAINT old_dinoparc_session__dinoparc_user__fk FOREIGN KEY (dinoparc_server, dinoparc_user_id) REFERENCES dinoparc_users(dinoparc_server, dinoparc_user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO dinoparc_servers(dinoparc_server)
VALUES
  ('dinoparc.com'),
  ('en.dinoparc.com'),
  ('sp.dinoparc.com');
