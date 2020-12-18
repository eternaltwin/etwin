import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * A Dinoparc username.
 */
export type DinoparcUsername = string;

export const $DinoparcUsername: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 1,
  maxLength: 14,
  pattern: /^[0-9A-Za-z-]{1,14}$/,
});
