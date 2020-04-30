import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

export type EmailTitle = string;

export const $EmailTitle: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 1,
  maxLength: 100,
});
