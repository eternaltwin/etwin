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
