import { Ucs2StringType } from "kryo/ucs2-string";

/**
 * A Dinoparc dinoz id.
 */
export type DinoparcDinozId = string;

export const $DinoparcDinozId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 9,
  trimmed: true,
  pattern: /^(?:0|[1-9]\d{0,8})$/,
});
