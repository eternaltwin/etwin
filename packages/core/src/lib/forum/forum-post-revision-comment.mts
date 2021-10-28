import { $Null } from "kryo/null";
import { TryUnionType } from "kryo/try-union";
import { $Ucs2String } from "kryo/ucs2-string";

export type ForumPostRevisionComment = string;

export const $ForumPostRevisionComment = $Ucs2String;

export type NullableForumPostRevisionComment = null | ForumPostRevisionComment;

export const $NullableForumPostRevisionComment: TryUnionType<NullableForumPostRevisionComment> = new TryUnionType({variants: [$Null, $ForumPostRevisionComment]});
