import { Ucs2StringType } from "kryo/ucs2-string";
import { $UuidHex, UuidHex } from "kryo/uuid-hex";

/**
 * Id for authentication sessions.
 */
export type SessionId = UuidHex;

export const $SessionId: Ucs2StringType = $UuidHex;
