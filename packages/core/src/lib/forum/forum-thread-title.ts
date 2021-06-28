import { Ucs2StringType } from "kryo/lib/ucs2-string";

export type ForumThreadTitle = string;

export const $ForumThreadTitle: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 2,
  maxLength: 64,
});
