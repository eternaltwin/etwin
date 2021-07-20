import { Ucs2StringType } from "kryo/ucs2-string";

/**
 * A Hammerfest quest id.
 */
export type HammerfestQuestId = string;

export const $HammerfestQuestId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 2,
  trimmed: true,
  pattern: /^\d{1,2}$/,
});
