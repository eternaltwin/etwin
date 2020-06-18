import { Ucs2StringType } from "kryo/lib/ucs2-string.js";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex.js";

export type ForumPostId = UuidHex;

export const $ForumPostId: Ucs2StringType = $UuidHex;
