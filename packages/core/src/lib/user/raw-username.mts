import { Ucs2StringType } from "kryo/ucs2-string";

/**
 * Raw username: username before normalization to lowercase.
 * It should only be used for user input and normalized as soon as possible.
 */
export type RawUsername = string;

export const $RawUsername: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 3,
  maxLength: 32,
  pattern: /^[A-Za-z_][A-Za-z0-9_]{2,31}$/,
});
