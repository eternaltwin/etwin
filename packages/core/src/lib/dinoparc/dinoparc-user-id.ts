import { Ucs2StringType } from "kryo/lib/ucs2-string";

/**
 * A Dinoparc user id.
 */
export type DinoparcUserId = string;

export const $DinoparcUserId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 9,
  trimmed: true,
  pattern: /^[1-9]\d{0,8}$/,
});
