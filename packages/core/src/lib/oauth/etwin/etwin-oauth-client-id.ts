import { Ucs2StringType } from "kryo/lib/ucs2-string.js";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex.js";

/**
 * Oauth Client ID as provided by Eternal-Twin.
 *
 * If you want a more general client id for any OAuth provider, use `OAuthClientId`.
 */
export type EtwinOauthClientId = UuidHex;

export const $EtwinOauthClientId: Ucs2StringType = $UuidHex;
