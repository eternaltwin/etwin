import { Ucs2StringType } from "kryo/ucs2-string";
import { $UuidHex, UuidHex } from "kryo/uuid-hex";

export type ForumThreadId = UuidHex;

export const $ForumThreadId: Ucs2StringType = $UuidHex;
