import { $Ucs2String, Ucs2StringType } from "kryo/ucs2-string";

/**
 * Authorization grant code
 */
export type OauthCode = string;

export const $OauthCode: Ucs2StringType = $Ucs2String;
