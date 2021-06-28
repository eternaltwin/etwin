import { Ucs2StringType } from "kryo/lib/ucs2-string";

/**
 * Text or HTML body of the email.
 */
export type EmailBody = string;

export const $EmailBody: Ucs2StringType = new Ucs2StringType({
  maxLength: 10000,
});
