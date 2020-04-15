import { $EmailAddress, EmailAddress } from "@eternal-twin/etwin-api-types/lib/email/email-address.js";
import { $Date } from "kryo/lib/date.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

export interface EmailRegistrationJwt {
  email: EmailAddress;

  issuedAt: Date;

  expirationTime: Date;
}

export const $EmailRegistrationJwt: RecordIoType<EmailRegistrationJwt> = new RecordType<EmailRegistrationJwt>({
  properties: {
    email: {type: $EmailAddress},
    issuedAt: {type: $Date, rename: "iat"},
    expirationTime: {type: $Date, rename: "exp"},
  },
});
