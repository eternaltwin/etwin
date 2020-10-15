import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * A Twinoid user id.
 */
export type TwinoidUserId = string;

export const $TwinoidUserId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 12,
  trimmed: true,
  pattern: /^[1-9]\d{0,11}$/,
});
