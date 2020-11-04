import { Ucs2StringType } from "kryo/lib/ucs2-string.js";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex.js";

/**
 * Oauth Client ID as provided by Eternal-Twin.
 *
 * If you want a more general client id as defined by the RFC and not specific to any OAuth provider, use `RfcOauthClientId`.
 */
export type OauthClientId = UuidHex;

export const $OauthClientId: Ucs2StringType = $UuidHex;
