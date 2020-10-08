COMMENT ON SCHEMA public IS '{"version": "V004"}';

CREATE DOMAIN HAMMERFEST_SERVER AS VARCHAR(13) CHECK (VALUE IN ('hammerfest.es', 'hammerfest.fr', 'hfest.net'));
CREATE DOMAIN HAMMERFEST_SESSION_KEY AS VARCHAR(26) CHECK (VALUE ~ '^[0-9a-z]{26}$');
CREATE DOMAIN HAMMERFEST_USER_ID AS VARCHAR(10) CHECK (VALUE ~ '^[1-9]\d{0,9}$');
CREATE DOMAIN TWINOID_USER_ID AS VARCHAR(10) CHECK (VALUE ~ '^[1-9]\d{0,9}$');

CREATE TABLE public.twinoid_users
(
    -- User ID on the Twinoid server
    twinoid_user_id TWINOID_USER_ID PRIMARY KEY NOT NULL,
    -- Twinoid name
    name            VARCHAR(50)     NOT NULL
);

-- Active links between Eternal-Twin and Twinoid users
CREATE TABLE public.twinoid_user_links
(
    -- Eternal-Twin user id
    user_id         UUID            NOT NULL,
    -- User ID on the Twinoid server
    twinoid_user_id TWINOID_USER_ID NOT NULL,
    -- Link creation time
    ctime           TIMESTAMP(3)    NOT NULL,
    PRIMARY KEY (user_id, twinoid_user_id),
    CONSTRAINT twinoid_user_link__user__fk FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT twinoid_user_link__twinoid_user__fk FOREIGN KEY (twinoid_user_id) REFERENCES twinoid_users (twinoid_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Cancelled links between Eternal-Twin and Twinoid users
CREATE TABLE public.old_twinoid_user_links
(
    -- Eternal-Twin user id
    user_id         UUID            NOT NULL,
    -- Twinoid user id
    twinoid_user_id TWINOID_USER_ID NOT NULL,
    start_time      TIMESTAMP(3),
    end_time        TIMESTAMP(3),
    PRIMARY KEY (user_id, twinoid_user_id),
    CONSTRAINT twinoid_user_link__user__fk FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT twinoid_user_link__twinoid_user__fk FOREIGN KEY (twinoid_user_id) REFERENCES twinoid_users (twinoid_user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);


ALTER TABLE hammerfest_user_links
    RENAME hammerfest_user_id TO old_hammerfest_user_id;
ALTER TABLE hammerfest_user_links
    ADD COLUMN hammerfest_user_id HAMMERFEST_USER_ID;
ALTER TABLE hammerfest_user_links
    ALTER COLUMN hammerfest_server TYPE HAMMERFEST_SERVER;
-- noinspection SqlWithoutWhere
UPDATE hammerfest_user_links
SET hammerfest_user_id = old_hammerfest_user_id::VARCHAR;

ALTER TABLE hammerfest_users
    ADD COLUMN hammerfest_user_id HAMMERFEST_USER_ID;
ALTER TABLE hammerfest_users
    RENAME "server" TO hammerfest_server;
ALTER TABLE hammerfest_users
    ALTER COLUMN hammerfest_server TYPE HAMMERFEST_SERVER;
-- noinspection SqlWithoutWhere
UPDATE hammerfest_users
SET hammerfest_user_id = user_id::VARCHAR;

ALTER TABLE hammerfest_user_links
    DROP CONSTRAINT hammerfest_user_link__hammerfest_user__fk;
ALTER TABLE hammerfest_users
    DROP CONSTRAINT hammerfest_users_pkey;
ALTER TABLE hammerfest_users
    ADD PRIMARY KEY (hammerfest_server, hammerfest_user_id);
ALTER TABLE hammerfest_user_links
    ADD CONSTRAINT hammerfest_user_link__hammerfest_user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users (hammerfest_server, hammerfest_user_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE hammerfest_servers
    RENAME domain TO hammerfest_server;
ALTER TABLE hammerfest_servers
    ALTER COLUMN hammerfest_server TYPE HAMMERFEST_SERVER;

ALTER TABLE hammerfest_users
    DROP COLUMN user_id;
ALTER TABLE hammerfest_user_links
    DROP COLUMN old_hammerfest_user_id;

-- Active Hammerfest sessions
CREATE TABLE public.hammerfest_sessions
(
    hammerfest_server HAMMERFEST_SERVER NOT NULL,
    hammerfest_session_key BYTEA NOT NULL,
    _hammerfest_session_key_hash BYTEA NOT NULL,
    hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
    -- Session creation time
    ctime TIMESTAMP(3) NOT NULL,
    -- Session access time
    atime TIMESTAMP(3) NOT NULL,
    CHECK (atime >= ctime),
    PRIMARY KEY (hammerfest_server, _hammerfest_session_key_hash),
    UNIQUE (hammerfest_server, hammerfest_user_id),
    CONSTRAINT hammerfest_session__hammerfest_user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Revoked Hammerfest sessions
CREATE TABLE public.old_hammerfest_sessions
(
    hammerfest_server HAMMERFEST_SERVER NOT NULL,
    hammerfest_session_key BYTEA NOT NULL,
    _hammerfest_session_key_hash BYTEA NOT NULL,
    hammerfest_user_id HAMMERFEST_USER_ID NOT NULL,
    -- Session creation time
    ctime TIMESTAMP(3) NOT NULL,
    -- Session access time
    atime TIMESTAMP(3) NOT NULL,
    -- Session deletion time
    dtime TIMESTAMP(3) NOT NULL,
    CHECK (atime >= ctime),
    CHECK (dtime >= atime),
    CHECK (dtime > ctime),
    PRIMARY KEY (hammerfest_server, _hammerfest_session_key_hash, ctime),
    CONSTRAINT old_hammerfest_session__hammerfest_user__fk FOREIGN KEY (hammerfest_server, hammerfest_user_id) REFERENCES hammerfest_users(hammerfest_server, hammerfest_user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Active Twinoid access tokens
CREATE TABLE public.twinoid_access_tokens
(
    twinoid_access_token BYTEA NOT NULL,
    _twinoid_access_token_hash BYTEA NOT NULL,
    twinoid_user_id TWINOID_USER_ID NOT NULL,
    -- Access token creation time
    ctime TIMESTAMP(3) NOT NULL,
    -- Access token access time
    atime TIMESTAMP(3) NOT NULL,
    -- Access token expiration time
    expiration_time TIMESTAMP(3) NOT NULL,
    CHECK (ctime <= atime),
    CHECK (atime <= expiration_time),
    CHECK (ctime < expiration_time),
    PRIMARY KEY (_twinoid_access_token_hash),
    UNIQUE (twinoid_user_id),
    CONSTRAINT twinoid_access_token__twinoid_user__fk FOREIGN KEY (twinoid_user_id) REFERENCES twinoid_users(twinoid_user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Revoked or expired Twinoid access tokens
CREATE TABLE public.old_twinoid_access_tokens
(
    twinoid_access_token BYTEA NOT NULL,
    _twinoid_access_token_hash BYTEA NOT NULL,
    twinoid_user_id TWINOID_USER_ID NOT NULL,
    -- Access token creation time
    ctime TIMESTAMP(3) NOT NULL,
    -- Access token access time
    atime TIMESTAMP(3) NOT NULL,
    -- Refresh token deletion time
    dtime TIMESTAMP(3) NOT NULL,
    -- Access token expiration time
    expiration_time TIMESTAMP(3) NOT NULL,
    CHECK (ctime <= atime),
    CHECK (atime <= expiration_time),
    CHECK (ctime < expiration_time),
    CHECK (atime <= dtime),
    CHECK (ctime < dtime),
    PRIMARY KEY (_twinoid_access_token_hash, ctime),
    CONSTRAINT twinoid_access_token__twinoid_user__fk FOREIGN KEY (twinoid_user_id) REFERENCES twinoid_users(twinoid_user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Active Twinoid refresh tokens
CREATE TABLE public.twinoid_refresh_tokens
(
    twinoid_refresh_token BYTEA NOT NULL,
    _twinoid_refresh_token_hash BYTEA NOT NULL,
    twinoid_user_id TWINOID_USER_ID NOT NULL,
    -- Refresh token creation time
    ctime TIMESTAMP(3) NOT NULL,
    -- Refresh token access time
    atime TIMESTAMP(3) NOT NULL,
    CHECK (ctime <= atime),
    PRIMARY KEY (_twinoid_refresh_token_hash),
    UNIQUE (twinoid_user_id),
    CONSTRAINT twinoid_refresh_token__twinoid_user__fk FOREIGN KEY (twinoid_user_id) REFERENCES twinoid_users(twinoid_user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Revoked Twinoid refresh tokens
CREATE TABLE public.old_twinoid_refresh_tokens
(
    twinoid_refresh_token BYTEA NOT NULL,
    _twinoid_refresh_token_hash BYTEA NOT NULL,
    twinoid_user_id TWINOID_USER_ID NOT NULL,
    -- Refresh token creation time
    ctime TIMESTAMP(3) NOT NULL,
    -- Refresh token access time
    atime TIMESTAMP(3) NOT NULL,
    -- Refresh token deletion time
    dtime TIMESTAMP(3) NOT NULL,
    CHECK (ctime <= atime),
    CHECK (atime <= dtime),
    CHECK (ctime < dtime),
    PRIMARY KEY (_twinoid_refresh_token_hash, ctime),
    CONSTRAINT old_twinoid_refresh_token__twinoid_user__fk FOREIGN KEY (twinoid_user_id) REFERENCES twinoid_users(twinoid_user_id) ON DELETE CASCADE ON UPDATE CASCADE
);
