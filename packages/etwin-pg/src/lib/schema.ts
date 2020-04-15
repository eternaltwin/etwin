export interface UserRow {
  user_id: string;

  ctime: Date;

  display_name: string;

  email_address: Uint8Array | null;

  email_address_mtime: Date;

  /**
   * Username used to sign-in with a password.
   */
  username: string | null;

  username_mtime: Date;
}

export interface UserEmailAddressRow {
  user_id: string;
  address: string;
  verification_time: Date;
  verification_ip: null | unknown;
}

/**
 * Represents a user's display name before it was changed.
 *
 * It corresponds to the period of time starting at the previous `OldUserDisplayNameRow`'s end time (or the user
 * creation) and ending at `end_time`.
 */
export interface OldUserDisplayNameRow {
  user_id: string;
  display_name: string;
  end_time: string;
}

export interface UserCreationRow {
  user_id: string;
  creation_time: Date;

  /**
   * IPv6 address of the creation request.
   */
  creation_ip: null | unknown;
}
