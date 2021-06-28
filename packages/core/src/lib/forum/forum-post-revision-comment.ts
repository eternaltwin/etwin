import { $Null } from "kryo/lib/null";
import { TryUnionType } from "kryo/lib/try-union";
import { $Ucs2String } from "kryo/lib/ucs2-string";

export type ForumPostRevisionComment = string;

export const $ForumPostRevisionComment = $Ucs2String;

export type NullableForumPostRevisionComment = null | ForumPostRevisionComment;

export const $NullableForumPostRevisionComment: TryUnionType<NullableForumPostRevisionComment> = new TryUnionType({variants: [$Null, $ForumPostRevisionComment]});
