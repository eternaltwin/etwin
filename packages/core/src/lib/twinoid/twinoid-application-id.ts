import { Ucs2StringType } from "kryo/lib/ucs2-string";

/**
 * A Twinoid application id.
 */
export type TwinoidApplicationId = string;

export const $TwinoidApplicationId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 12,
  trimmed: true,
  pattern: /^[1-9]\d{0,11}$/,
});
