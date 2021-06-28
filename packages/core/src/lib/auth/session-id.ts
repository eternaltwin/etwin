import { Ucs2StringType } from "kryo/lib/ucs2-string";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex";

/**
 * Id for authentication sessions.
 */
export type SessionId = UuidHex;

export const $SessionId: Ucs2StringType = $UuidHex;
