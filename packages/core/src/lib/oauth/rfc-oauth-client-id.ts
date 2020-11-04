import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * Oauth Client ID as defined by the RFC (not specific to any provider).
 *
 * If you want a more specific client id for the Eternal-Twin provider, use `OauthClientId`.
 */
export type RfcOauthClientId = string;

export const $RfcOauthClientId: Ucs2StringType = new Ucs2StringType({maxLength: 256});
