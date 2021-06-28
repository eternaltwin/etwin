import { Ucs2StringType } from "kryo/lib/ucs2-string";

/**
 * A Dinoparc reward id.
 */
export type DinoparcRewardId = string;

export const $DinoparcRewardId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 2,
  trimmed: true,
  pattern: /^[1-9]\d?$/,
});
