import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string";

import { $Password, Password } from "../password/password.js";
import { $UserDisplayName, UserDisplayName } from "../user/user-display-name.js";

export interface RegisterWithVerifiedEmailOptions {
  /**
   * Email verification token.
   *
   * This token is sent to the inbox of the registrant. He must provide it back
   * to prove access to the inbox. This token allows to retrieve the email
   * address.
   */
  emailVerificationToken: string;

  /**
   * Display name for the new user.
   *
   * Default derived from the email address.
   */
  displayName?: UserDisplayName;

  /**
   * Password for the new user.
   */
  password: Password;
}

export const $RegisterWithVerifiedEmailOptions: RecordIoType<RegisterWithVerifiedEmailOptions> = new RecordType<RegisterWithVerifiedEmailOptions>({
  properties: {
    emailVerificationToken: {type: $Ucs2String},
    displayName: {type: $UserDisplayName, optional: true},
    password: {type: $Password},
  },
  changeCase: CaseStyle.SnakeCase,
});
