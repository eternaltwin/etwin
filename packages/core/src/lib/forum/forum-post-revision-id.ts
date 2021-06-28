import { Ucs2StringType } from "kryo/lib/ucs2-string";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex";

export type ForumPostRevisionId = UuidHex;

export const $ForumPostRevisionId: Ucs2StringType = $UuidHex;
