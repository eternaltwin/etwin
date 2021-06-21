import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * A Dinoparc dinoz name
 */
export type DinoparcDinozName = string;

export const $DinoparcDinozName: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 1,
  maxLength: 50,
  pattern: /^.{1,50}$/,
});
