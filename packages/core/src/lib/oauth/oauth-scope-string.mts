import { $Ucs2String, Ucs2StringType } from "kryo/ucs2-string";

/**
 * Oauth scopes encoded as a string.
 *
 * The string corresponds to `scopes.join(" ")`.
 */
export type OauthScopeString = string;

export const $OauthScopeString: Ucs2StringType = $Ucs2String;
