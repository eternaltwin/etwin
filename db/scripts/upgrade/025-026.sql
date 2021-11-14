CREATE DOMAIN forum_thread_key AS VARCHAR(32) CHECK (value ~ '^[a-z_][a-z0-9_]{1,31}$');
