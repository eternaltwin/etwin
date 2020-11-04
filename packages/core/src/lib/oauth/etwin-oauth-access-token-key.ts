import { Ucs2StringType } from "kryo/lib/ucs2-string.js";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex.js";

export type EtwinOauthAccessTokenKey = UuidHex;

export const $EtwinOauthAccessTokenKey: Ucs2StringType = $UuidHex;
