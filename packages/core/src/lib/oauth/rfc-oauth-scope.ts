import { $Ucs2String, Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * A single OAuth scope
 */
export type RfcOauthScope = string;

export const $RfcOauthScope: Ucs2StringType = $Ucs2String;
