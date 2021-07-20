import { $Null } from "kryo/null";
import { TryUnionType } from "kryo/try-union";
import { $Ucs2String, Ucs2StringType } from "kryo/ucs2-string";

export type ForumSectionKey = string;

export const $ForumSectionKey: Ucs2StringType = $Ucs2String;

export type NullableForumSectionKey = null | ForumSectionKey;

export const $NullableForumSectionKey: TryUnionType<NullableForumSectionKey> = new TryUnionType({variants: [$Null, $ForumSectionKey]});
