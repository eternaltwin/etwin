import { Ucs2StringType } from "kryo/ucs2-string";

export type OauthClientDisplayName = string;

export const $OauthClientDisplayName: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 2,
  maxLength: 32,
  pattern: /^[A-Za-z_ ()-]{2,32}$/,
});
