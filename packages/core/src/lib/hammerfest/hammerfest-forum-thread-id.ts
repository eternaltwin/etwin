import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * A Hammerfest forum thread id.
 */
export type HammerfestForumThreadId = string;

export const $HammerfestForumThreadId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 9,
  trimmed: true,
  pattern: /^\d{1,9}$/,
});
