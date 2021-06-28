import { Ucs2StringType } from "kryo/lib/ucs2-string";

export type EmailTitle = string;

export const $EmailTitle: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 1,
  maxLength: 100,
});
