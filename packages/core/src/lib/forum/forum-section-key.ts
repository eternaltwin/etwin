import { $Null } from "kryo/lib/null.js";
import { TryUnionType } from "kryo/lib/try-union.js";
import { $Ucs2String, Ucs2StringType } from "kryo/lib/ucs2-string.js";

export type ForumSectionKey = string;

export const $ForumSectionKey: Ucs2StringType = $Ucs2String;

export type NullableForumSectionKey = null | ForumSectionKey;

export const $NullableForumSectionKey: TryUnionType<NullableForumSectionKey> = new TryUnionType({variants: [$Null, $ForumSectionKey]});
