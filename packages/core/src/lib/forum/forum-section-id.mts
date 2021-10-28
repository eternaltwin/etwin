import { Ucs2StringType } from "kryo/ucs2-string";
import { $UuidHex, UuidHex } from "kryo/uuid-hex";

export type ForumSectionId = UuidHex;

export const $ForumSectionId: Ucs2StringType = $UuidHex;
