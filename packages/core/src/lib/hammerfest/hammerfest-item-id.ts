import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * A Hammerfest item id.
 */
export type HammerfestItemId = string;

export const $HammerfestItemId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 4,
  trimmed: true,
  pattern: /^0|[1-9]\d{0,3}$/,
});
