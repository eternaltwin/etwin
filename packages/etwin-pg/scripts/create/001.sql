COMMENT ON SCHEMA public IS '{"version": "V001"}';

-- A user
CREATE TABLE public.users (
  user_id      UUID PRIMARY KEY                  NOT NULL,
  display_name VARCHAR(64)                       NOT NULL
);
