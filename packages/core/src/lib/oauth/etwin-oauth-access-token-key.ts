import { Ucs2StringType } from "kryo/ucs2-string";
import { $UuidHex, UuidHex } from "kryo/uuid-hex";

export type EtwinOauthAccessTokenKey = UuidHex;

export const $EtwinOauthAccessTokenKey: Ucs2StringType = $UuidHex;
