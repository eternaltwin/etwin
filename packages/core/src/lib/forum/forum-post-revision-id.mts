import { Ucs2StringType } from "kryo/ucs2-string";
import { $UuidHex, UuidHex } from "kryo/uuid-hex";

export type ForumPostRevisionId = UuidHex;

export const $ForumPostRevisionId: Ucs2StringType = $UuidHex;
