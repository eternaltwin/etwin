export type PgUserId = string;
export type PgDinoparcUserId = string;
export type PgDinoparcUsername = string;
export type PgHammerfestUserId = string;
export type PgTwinoidUserId = string;
export type PgInstant = Date;
export type PgDinoparcServer = "dinoparc.com" | "en.dinoparc.com" | "sp.dinoparc.com";
export type PgHammerfestServer = "hammerfest.es" | "hammerfest.fr" | "hfest.net";
export type PgAnnouncementId = string;
export type PgForumThreadId = string;
export type PgLocaleId = string;

export interface UserRow {
  user_id: PgUserId;

  ctime: PgInstant;

  display_name: string;

  display_name_mtime: PgInstant;

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

export interface DinoparcUserRow {
  dinoparc_server: PgDinoparcServer;

  dinoparc_user_id: PgDinoparcUserId;

  username: PgDinoparcUsername;
}

export interface DinoparcUserLinkRow {
  user_id: PgUserId;

  dinoparc_server: PgDinoparcServer;

  dinoparc_user_id: PgDinoparcUserId;

  linked_at: PgInstant;

  linked_by: PgUserId;
}

export interface HammerfestUserRow {
  hammerfest_server: PgHammerfestServer;

  hammerfest_user_id: string;

  username: string;
}

export interface HammerfestUserLinkRow {
  user_id: PgUserId;

  hammerfest_server: PgHammerfestServer;

  hammerfest_user_id: PgHammerfestUserId;

  linked_at: PgInstant;

  linked_by: PgUserId;
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

export interface AnnouncementRow {
  announcement_id: PgAnnouncementId;
  forum_thread_id: PgForumThreadId;
  created_at: PgInstant;
  created_by: PgUserId;
  locale: PgLocaleId | null;
}

export interface TwinoidUserRow {
  twinoid_user_id: string;

  name: string;
}

export interface TwinoidUserLinkRow {
  user_id: PgUserId;

  twinoid_user_id: PgTwinoidUserId;

  linked_at: PgInstant;

  linked_by: PgUserId;
}

export interface DinoparcSessionRow {
  dinoparc_server: PgDinoparcServer;
  dinoparc_session_key: string;
  dinoparc_user_id: string;
  ctime: Date;
  atime: Date;
}

export interface OldDinoparcSessionRow {
  dinoparc_server: PgDinoparcServer;
  dinoparc_session_key: string;
  dinoparc_user_id: string;
  ctime: Date;
  atime: Date;
  dtime: Date;
}

export interface HammerfestSessionRow {
  hammerfest_server: PgHammerfestServer;
  hammerfest_session_key: string;
  hammerfest_user_id: string;
  ctime: Date;
  atime: Date;
}

export interface OldHammerfestSessionRow {
  hammerfest_server: PgHammerfestServer;
  hammerfest_session_key: string;
  hammerfest_user_id: string;
  ctime: Date;
  atime: Date;
  dtime: Date;
}

export interface TwinoidAccessTokenRow {
  twinoid_access_token: string;
  twinoid_user_id: string;
  ctime: Date;
  atime: Date;
  expiration_time: Date;
}

export interface OldTwinoidAccessTokenRow {
  twinoid_access_token: string;
  twinoid_user_id: string;
  ctime: Date;
  atime: Date;
  dtime: Date;
  expiration_time: Date;
}

export interface TwinoidRefreshTokenRow {
  twinoid_refresh_token: string;
  twinoid_user_id: string;
  ctime: Date;
  atime: Date;
}

export interface OldTwinoidRefreshTokenRow {
  twinoid_refresh_token: string;
  twinoid_user_id: string;
  ctime: Date;
  atime: Date;
  dtime: Date;
}
