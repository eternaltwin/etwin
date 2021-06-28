import { $Null } from "kryo/lib/null";
import { TryUnionType } from "kryo/lib/try-union";
import { $Ucs2String, Ucs2StringType } from "kryo/lib/ucs2-string";

export type ForumSectionKey = string;

export const $ForumSectionKey: Ucs2StringType = $Ucs2String;

export type NullableForumSectionKey = null | ForumSectionKey;

export const $NullableForumSectionKey: TryUnionType<NullableForumSectionKey> = new TryUnionType({variants: [$Null, $ForumSectionKey]});
