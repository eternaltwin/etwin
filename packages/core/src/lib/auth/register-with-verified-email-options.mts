import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";

import { $Password, Password } from "../password/password.mjs";
import { $UserDisplayName, UserDisplayName } from "../user/user-display-name.mjs";

export interface RegisterWithVerifiedEmailOptions {
  /**
   * Email verification token.
   *
   * This token is sent to the inbox of the registrant. He must provide it back
   * to prove access to the inbox. This token allows to retrieve the email
   * address.
   */
  emailToken: string;

  /**
   * Display name for the new user.
   *
   * Default derived from the email address.
   */
  displayName: UserDisplayName;

  /**
   * Password for the new user.
   */
  password: Password;
}

export const $RegisterWithVerifiedEmailOptions: RecordIoType<RegisterWithVerifiedEmailOptions> = new RecordType<RegisterWithVerifiedEmailOptions>({
  properties: {
    emailToken: {type: $Ucs2String},
    displayName: {type: $UserDisplayName},
    password: {type: $Password},
  },
  changeCase: CaseStyle.SnakeCase,
});
