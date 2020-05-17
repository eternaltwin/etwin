import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

export type OauthClientId = string;

export const $OauthClientId: Ucs2StringType = new Ucs2StringType({maxLength: 256});
