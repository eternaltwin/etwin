import { $Uint53 } from "kryo/lib/integer";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $EmailAddress, EmailAddress } from "../email/email-address.js";

export interface EmailRegistrationJwt {
  email: EmailAddress;

  issuedAt: number;

  expirationTime: number;
}

export const $EmailRegistrationJwt: RecordIoType<EmailRegistrationJwt> = new RecordType<EmailRegistrationJwt>({
  properties: {
    email: {type: $EmailAddress},
    issuedAt: {type: $Uint53, rename: "iat"},
    expirationTime: {type: $Uint53, rename: "exp"},
  },
});
