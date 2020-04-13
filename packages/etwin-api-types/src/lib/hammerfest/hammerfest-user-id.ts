import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * A Hammerfest user id.
 */
export type HammerfestUserId = string;

export const $HammerfestUserId: Ucs2StringType = new Ucs2StringType({maxLength: 10, trimmed: true, pattern: /^\d+$/});
