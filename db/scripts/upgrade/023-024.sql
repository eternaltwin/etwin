CREATE DOMAIN forum_section_id AS UUID;
CREATE DOMAIN forum_section_key AS VARCHAR(32) CHECK (value ~ '^[a-z_][a-z0-9_]{1,31}$');
CREATE DOMAIN forum_section_display_name AS VARCHAR(64);
