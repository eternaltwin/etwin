import { Ucs2StringType } from "kryo/ucs2-string";

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
