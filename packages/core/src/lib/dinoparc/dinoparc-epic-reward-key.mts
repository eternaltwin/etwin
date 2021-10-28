import { Ucs2StringType } from "kryo/ucs2-string";

/**
 * A Dinoparc epic reward key.
 */
export type DinoparcEpicRewardKey = string;

export const $DinoparcEpicRewardKey: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 30,
  trimmed: true,
  pattern: /^[a-z0-9_]{1,30}$/,
});
