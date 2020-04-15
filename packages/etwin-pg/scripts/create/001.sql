COMMENT ON SCHEMA public IS '{"version": "V001"}';

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- A user
CREATE TABLE public.users (
  user_id UUID PRIMARY KEY NOT NULL,
  display_name VARCHAR(64) NOT NULL
);

-- Table of pending email registrations: registrations waiting for the email to be verified.
CREATE TABLE public.pending_email_registrations (
  -- Email address, encrypted with `pgp_sym_encrypt`
  email_address BYTEA NOT NULL,
  display_name VARCHAR(64) NOT NULL
);
