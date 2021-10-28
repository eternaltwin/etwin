import { Ucs2StringType } from "kryo/ucs2-string";
import { $UuidHex, UuidHex } from "kryo/uuid-hex";

/**
 * The user id is a UUID representing an Eternal-Twin user.
 */
export type UserId = UuidHex;

export const $UserId: Ucs2StringType = $UuidHex;
