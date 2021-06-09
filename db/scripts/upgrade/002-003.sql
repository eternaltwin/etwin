CREATE TABLE public.forum_sections (
  forum_section_id UUID PRIMARY KEY NOT NULL,
  key VARCHAR(32) NULL,
  ctime TIMESTAMP(3),
  display_name VARCHAR(64) NOT NULL,
  display_name_mtime TIMESTAMP(3) NOT NULL,
  locale VARCHAR(10) NULL,
  locale_mtime TIMESTAMP(3) NOT NULL,
  CHECK (display_name_mtime >= ctime),
  UNIQUE (key)
);

CREATE TABLE public.forum_threads (
  forum_thread_id UUID PRIMARY KEY NOT NULL,
  key VARCHAR(32) NULL,
  ctime TIMESTAMP(3),
  title VARCHAR(64) NOT NULL,
  title_mtime TIMESTAMP(3) NOT NULL,
  forum_section_id UUID NOT NULL,
  is_pinned BOOLEAN NOT NULL,
  is_pinned_mtime TIMESTAMP(3) NOT NULL,
  is_locked BOOLEAN NOT NULL,
  is_locked_mtime TIMESTAMP(3) NOT NULL,
  CONSTRAINT forum_thread__forum_section__fk FOREIGN KEY (forum_section_id) REFERENCES forum_sections(forum_section_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (title_mtime >= ctime),
  CHECK (is_pinned_mtime >= ctime),
  CHECK (is_locked_mtime >= ctime),
  UNIQUE (key)
);

CREATE TABLE public.forum_posts (
  forum_post_id UUID PRIMARY KEY NOT NULL,
  ctime TIMESTAMP(3),
  forum_thread_id UUID NOT NULL,
  CONSTRAINT forum_post__forum_thread__fk FOREIGN KEY (forum_thread_id) REFERENCES forum_threads(forum_thread_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE public.forum_post_revisions (
  forum_post_revision_id UUID PRIMARY KEY NOT NULL,
  time TIMESTAMP(3),
  -- Post body in Marktwin format. `null` indicates that the post was deleted/hidden.
  body TEXT NULL,
  _html_body TEXT NULL,
  mod_body TEXT NULL,
  _html_mod_body TEXT NULL,
  forum_post_id UUID NOT NULL,
  author_id UUID NOT NULL,
  -- -- Optional comment describing the changes in this revision
  comment VARCHAR(200) NULL,
  CHECK ((body IS NULL) = (_html_body IS NULL)),
  CHECK ((mod_body IS NULL) = (_html_mod_body IS NULL)),
  CONSTRAINT forum_post_revision__forum_revision__fk FOREIGN KEY (forum_post_id) REFERENCES forum_posts(forum_post_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT forum_post_revision__user__fk FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE public._post_formatting_costs (
  forum_post_revision_id UUID NOT NULL,
  formatting VARCHAR(20) NOT NULL,
  cost INTEGER,
  PRIMARY KEY (forum_post_revision_id, formatting),
  CONSTRAINT forum_post_revision__forum_revision__fk FOREIGN KEY (forum_post_revision_id) REFERENCES forum_post_revisions(forum_post_revision_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (cost > 0)
);

CREATE TABLE public.forum_role_grants (
  forum_section_id UUID NOT NULL,
  user_id UUID NOT NULL,
  start_time TIMESTAMP(3),
  -- User who granted the moderator permissions
  granted_by UUID NOT NULL,
  CONSTRAINT forum_moderator__forum_section__fk FOREIGN KEY (forum_section_id) REFERENCES forum_sections(forum_section_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT forum_moderator__user__fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT forum_moderator_granter__user__fk FOREIGN KEY (granted_by) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  PRIMARY KEY (forum_section_id, user_id)
);

CREATE TABLE public.forum_role_revocations (
  forum_section_id UUID NOT NULL,
  user_id UUID NOT NULL,
  start_time TIMESTAMP(3),
  end_time TIMESTAMP(3),
  -- User who granted the moderator permissions
  granted_by UUID NOT NULL,
  -- User who revoked the moderator permissions
  revoked_by UUID NOT NULL,
  CONSTRAINT forum_role_revocation__forum_section__fk FOREIGN KEY (forum_section_id) REFERENCES forum_sections(forum_section_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT forum_role_revocation_user__user__fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT forum_moderator_granter__user__fk FOREIGN KEY (granted_by) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT forum_moderator_revoker__user__fk FOREIGN KEY (revoked_by) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  PRIMARY KEY (forum_section_id, user_id, start_time),
  CHECK (start_time < end_time)
);
