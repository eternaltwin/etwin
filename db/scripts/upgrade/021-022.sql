CREATE DOMAIN oauth_client_id AS UUID;
CREATE DOMAIN session_id AS UUID;
CREATE DOMAIN oauth_client_key AS VARCHAR(40) CHECK (value ~ '^[a-z_][a-z0-9_]{1,31}@clients$');
