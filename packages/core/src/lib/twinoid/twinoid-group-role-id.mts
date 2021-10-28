import { Ucs2StringType } from "kryo/ucs2-string";

/**
 * A Twinoid group role id.
 */
export type TwinoidGroupRoleId = string;

export const $TwinoidGroupRoleId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 12,
  trimmed: true,
  pattern: /^[1-9]\d{0,11}$/,
});
