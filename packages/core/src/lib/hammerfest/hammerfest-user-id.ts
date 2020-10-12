import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * A Hammerfest user id.
 */
export type HammerfestUserId = string;

export const $HammerfestUserId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 9,
  trimmed: true,
  pattern: /^[1-9]\d{0,8}$/,
});
