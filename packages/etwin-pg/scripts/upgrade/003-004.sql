COMMENT ON SCHEMA public IS '{"version": "V004"}';

CREATE DOMAIN HAMMERFEST_SERVER AS VARCHAR(13) CHECK (VALUE IN ('hammerfest.es', 'hammerfest.fr', 'hfest.net'));
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
