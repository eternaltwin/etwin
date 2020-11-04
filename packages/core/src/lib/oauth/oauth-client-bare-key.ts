import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * Unique stable OAuth client identifier without the `@clients` suffix.
 */
export type OauthClientBareKey = string;

export const $OauthClientBareKey: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 2,
  maxLength: 32,
  pattern: /^[a-z_][a-z0-9_]{1,31}$/,
});
