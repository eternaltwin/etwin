import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * A Dinoparc location id.
 */
export type DinoparcLocationId = string;

export const $DinoparcLocationId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 4,
  trimmed: true,
  pattern: /^0|[1-9]\d{0,3}$/,
});
