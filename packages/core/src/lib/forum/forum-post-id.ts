import { Ucs2StringType } from "kryo/lib/ucs2-string";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex";

export type ForumPostId = UuidHex;

export const $ForumPostId: Ucs2StringType = $UuidHex;
