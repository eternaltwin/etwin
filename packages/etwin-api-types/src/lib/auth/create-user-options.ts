import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $EmailAddress, EmailAddress } from "../email/email-address.js";
import { $UserDisplayName, UserDisplayName } from "../user/user-display-name.js";
import { $Password, Password } from "./password.js";

export interface CreateUserOptions {
  /**
   * Email address for the new user.
   *
   * Not verified yet.
   */
  email: EmailAddress;

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

export const $CreateUserOptions: RecordIoType<CreateUserOptions> = new RecordType<CreateUserOptions>({
  properties: {
    email: {type: $EmailAddress},
    displayName: {type: $UserDisplayName, optional: true},
    password: {type: $Password},
  },
  changeCase: CaseStyle.SnakeCase,
});
