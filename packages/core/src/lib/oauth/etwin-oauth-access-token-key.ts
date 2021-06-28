import { Ucs2StringType } from "kryo/lib/ucs2-string";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex";

export type EtwinOauthAccessTokenKey = UuidHex;

export const $EtwinOauthAccessTokenKey: Ucs2StringType = $UuidHex;
