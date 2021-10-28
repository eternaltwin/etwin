import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $LocaleId, LocaleId } from "../core/locale-id.mjs";
import { $EmailAddress, EmailAddress } from "../email/email-address.mjs";

export interface RegisterOrLoginWithEmailOptions {
  /**
   * Email address for the new user.
   *
   * Not verified yet.
   */
  email: EmailAddress;

  /**
   * Preferred locale for the verification email.
   */
  locale?: LocaleId;
}

export const $RegisterOrLoginWithEmailOptions: RecordIoType<RegisterOrLoginWithEmailOptions> = new RecordType<RegisterOrLoginWithEmailOptions>({
  properties: {
    email: {type: $EmailAddress},
    locale: {type: $LocaleId, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
