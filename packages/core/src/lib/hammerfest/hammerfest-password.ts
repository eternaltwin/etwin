import { $Ucs2String, Ucs2StringType } from "kryo/lib/ucs2-string";

/**
 * Represents a clear Hammerfest password.
 */
export type HammerfestPassword = string;

export const $HammerfestPassword: Ucs2StringType = $Ucs2String;
