import { Ucs2StringType } from "kryo/lib/ucs2-string";

/**
 * A Dinoparc item id.
 */
export type DinoparcItemId = string;

export const $DinoparcItemId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 4,
  trimmed: true,
  pattern: /^0|[1-9]\d{0,3}$/,
});
