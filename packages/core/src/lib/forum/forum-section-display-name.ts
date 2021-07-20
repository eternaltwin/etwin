import { Ucs2StringType } from "kryo/ucs2-string";

export type ForumSectionDisplayName = string;

export const $ForumSectionDisplayName: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 2,
  maxLength: 64,
});
