import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * Oauth Client ID as provided by any provider.
 *
 * If you want a more specific client id for the Eternal-Twin provider, use `EtwinOAuthClientId`.
 */
export type OauthClientId = string;

export const $OauthClientId: Ucs2StringType = new Ucs2StringType({maxLength: 256});
