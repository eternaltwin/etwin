import { Ucs2StringType } from "kryo/lib/ucs2-string";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex";

export type ForumSectionId = UuidHex;

export const $ForumSectionId: Ucs2StringType = $UuidHex;
