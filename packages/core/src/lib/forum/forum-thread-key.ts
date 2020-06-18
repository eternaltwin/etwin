import { $Null } from "kryo/lib/null.js";
import { TryUnionType } from "kryo/lib/try-union.js";
import { $Ucs2String, Ucs2StringType } from "kryo/lib/ucs2-string.js";

export type ForumThreadKey = string;

export const $ForumThreadKey: Ucs2StringType = $Ucs2String;

export type NullableForumThreadKey = null | ForumThreadKey;

export const $NullableForumThreadKey: TryUnionType<NullableForumThreadKey> = new TryUnionType({variants: [$Null, $ForumThreadKey]});
