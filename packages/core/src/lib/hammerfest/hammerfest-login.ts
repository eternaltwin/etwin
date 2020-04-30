import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * A Hammerfest login / username.
 */
export type HammerfestLogin = string;

export const $HammerfestLogin: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 1,
  maxLength: 12,
  pattern: /^[0-9A-Za-z]{1,12}$/,
});
