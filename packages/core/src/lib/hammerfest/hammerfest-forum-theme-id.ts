import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * A Hammerfest forum theme id.
 */
export type HammerfestForumThemeId = string;

export const $HammerfestForumThemeId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 2,
  trimmed: true,
  pattern: /^\d{2}$/,
});
