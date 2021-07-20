import { Ucs2StringType } from "kryo/ucs2-string";
import { $UuidHex, UuidHex } from "kryo/uuid-hex";

export type ForumPostId = UuidHex;

export const $ForumPostId: Ucs2StringType = $UuidHex;
