import { Ucs2StringType } from "kryo/lib/ucs2-string.js";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex.js";

export type ForumSectionId = UuidHex;

export const $ForumSectionId: Ucs2StringType = $UuidHex;
