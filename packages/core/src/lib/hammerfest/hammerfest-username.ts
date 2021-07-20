import { Ucs2StringType } from "kryo/ucs2-string";

/**
 * A Hammerfest username.
 */
export type HammerfestUsername = string;

export const $HammerfestUsername: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 1,
  maxLength: 12,
  pattern: /^[0-9A-Za-z]{1,12}$/,
});
