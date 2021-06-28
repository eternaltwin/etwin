import { Ucs2StringType } from "kryo/lib/ucs2-string";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex";

export type ForumThreadId = UuidHex;

export const $ForumThreadId: Ucs2StringType = $UuidHex;
