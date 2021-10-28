import { Ucs2StringType } from "kryo/ucs2-string";

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
