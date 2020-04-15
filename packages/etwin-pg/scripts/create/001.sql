COMMENT ON SCHEMA public IS '{"version": "V001"}';

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- A user
CREATE TABLE public.users (
  -- User id
  user_id UUID PRIMARY KEY NOT NULL,
  -- User creation time
  ctime TIMESTAMP(0),
  -- Value to use when displaying the user's name. May be different from `username` or `email_address`.
  display_name VARCHAR(64) NOT NULL,
  -- Encrypted email address (using pgp_sym_encrypt)
  -- This may be `NULL` if the value was never set, or if the value was removed.
  email_address BYTEA NULL,
  -- Time of the last change to `email_address`
  email_address_mtime TIMESTAMP(0) NOT NULL,
  -- Unique username, mainly used for authentication
  -- This may be `NULL` if the value was never set, or if the value was removed.
  username VARCHAR(64) NULL,
  -- Time of the last change to `username
  username_mtime TIMESTAMP(0) NOT NULL,
  CHECK (email_address_mtime >= ctime),
  CHECK (username_mtime >= ctime),
  UNIQUE (email_address)
);

-- Table of email verifications: they may be validated or not
CREATE TABLE public.email_verifications (
  -- User id for this email
  user_id UUID NOT NULL,
  -- Encrypted email address (using pgp_sym_encrypt)
  email_address BYTEA NOT NULL,
  -- Date when the verification email was sent
  ctime TIMESTAMP(0) NOT NULL,
  -- Date when the email was validated. `null` if the email was not validated.
  validation_time TIMESTAMP NULL,
  CHECK (validation_time >= ctime),
  CONSTRAINT email_verification__user__fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- All the user sessions (active or expired)
CREATE TABLE public.sessions (
  -- Session id
  session_id UUID PRIMARY KEY NOT NULL,
  -- Id of the user authenticated by this session
  user_id UUID,
  -- Session creation time
  ctime TIMESTAMP(0) NOT NULL,
  -- Session access time
  atime TIMESTAMP(0) NOT NULL,
  -- Free-form session data
  data JSON NOT NULL,
  CHECK (atime >= ctime),
  CONSTRAINT session__user__fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Known Hammerfest servers
CREATE TABLE public.hammerfest_servers (
  -- Domain name for the Hammerfest server
  domain VARCHAR(64) PRIMARY KEY NOT NULL,
  CHECK (domain IN ('hammerfest.fr', 'hfest.net', 'hammerfest.es'))
);

-- Known Hammerfest users
CREATE TABLE public.hammerfest_users (
  -- Hammerfest server
  server VARCHAR(64) NOT NULL,
  -- User ID on the Hammerfest server
  user_id INT NOT NULL,
  -- Hammerfest username
  username VARCHAR(20) NOT NULL,
  PRIMARY KEY (server, user_id),
  CONSTRAINT hammerfest_user__hammerfest_server__fk FOREIGN KEY (server) REFERENCES hammerfest_servers(domain) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE (server, username)
);

-- Active links between Eternal-Twin and Hammerfest users
CREATE TABLE public.hammerfest_user_links (
  -- Eternal-Twin user id
  user_id UUID NOT NULL,
  -- Hammerfest server
  hammerfest_server VARCHAR(64) NOT NULL,
  -- User ID on the Hammerfest server
  hammerser_user_id INT NOT NULL,
  -- Link creation time
  ctime TIMESTAMP(0) NOT NULL,
  PRIMARY KEY (user_id, hammerfest_server, hammerser_user_id),
  CONSTRAINT hammerfest_user_link__user__fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT hammerfest_user_link__hammerfest_user__fk FOREIGN KEY (hammerfest_server, hammerser_user_id) REFERENCES hammerfest_users(server, user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);
