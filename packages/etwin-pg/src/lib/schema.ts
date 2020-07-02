export interface UserRow {
  user_id: string;

  ctime: Date;

  display_name: string;

  email_address: string | null;

  email_address_mtime: Date;

  /**
   * Username used to sign-in with a password.
   */
  username: string | null;

  username_mtime: Date;

  password: Uint8Array | null;

  password_mtime: Date;

  is_administrator: boolean;
}

export interface SessionRow {
  session_id: string;

  user_id: string;

  ctime: Date;

  atime: Date;

  data: object;
}

export interface HammerfestUserRow {
  server: string;

  user_id: number;

  username: string | null;
}


export interface HammerfestUserLinkRow {
  user_id: string;

  hammerfest_server: string;

  hammerfest_user_id: number;

  ctime: Date;
}

export interface OauthClientRow {
  oauth_client_id: string;

  key: string | null;

  ctime: Date;

  display_name: string;

  display_name_mtime: Date;

  app_uri: string;

  app_uri_mtime: Date;

  callback_uri: string;

  callback_uri_mtime: Date;

  email_address: string | null;

  email_address_mtime: Date;

  secret: Uint8Array;

  secret_mtime: Date;

  owner_id: string | null;
}

export interface OauthAccessTokenRow {
  oauth_access_token_id: string;
  oauth_client_id: string;
  user_id: string;
  ctime: Date;
  atime: Date;
}

export interface ForumSectionRow {
  forum_section_id: string;
  key: string | null;
  ctime: Date;
  display_name: string;
  display_name_mtime: Date;
  locale: string | null;
  locale_mtime: Date;
}

export interface ForumThreadRow {
  forum_thread_id: string;
  key: string | null;
  ctime: Date;
  title: string;
  title_mtime: Date;
  forum_section_id: string;
  is_pinned: boolean;
  is_pinned_mtime: Date;
  is_locked: boolean;
  is_locked_mtime: Date;
}

export interface ForumPostRow {
  forum_post_id: string;
  ctime: Date;
  forum_thread_id: string;
}

export interface ForumPostRevisionRow {
  forum_post_revision_id: string;
  time: Date;
  body: string | null;
  _html_body: string | null;
  mod_body: string | null;
  _html_mod_body: string | null;
  forum_post_id: string;
  author_id: string;
  comment: string | null;
}

export interface PostFormattingCostRow {
  forum_post_revision_id: string;
  formatting: string;
  cost: number;
}

export interface ForumRoleGrantRow {
  forum_section_id: string;
  user_id: string;
  start_time: Date;
  granted_by: string;
}

export interface ForumRoleRevocationRow {
  forum_section_id: string;
  user_id: string;
  start_time: Date;
  end_time: Date;
  granted_by: string;
  revoked_by: string;
}
