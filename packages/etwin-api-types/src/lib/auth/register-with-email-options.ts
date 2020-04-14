import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $LocaleId, LocaleId } from "../core/locale-id.js";
import { $EmailAddress, EmailAddress } from "../email/email-address.js";
import { $Password, Password } from "../password/password.js";
import { $UserDisplayName, UserDisplayName } from "../user/user-display-name.js";

export interface RegisterWithEmailOptions {
  /**
   * Email address for the new user.
   *
   * Not verified yet.
   */
  email: EmailAddress;

  /**
   * Preferred locale for the verification email.
   */
  verificationEmailLocale?: LocaleId;

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

export const $RegisterWithEmailOptions: RecordIoType<RegisterWithEmailOptions> = new RecordType<RegisterWithEmailOptions>({
  properties: {
    email: {type: $EmailAddress},
    verificationEmailLocale: {type: $LocaleId, optional: true},
    displayName: {type: $UserDisplayName, optional: true},
    password: {type: $Password},
  },
  changeCase: CaseStyle.SnakeCase,
});
