import { ArrayType } from "kryo/lib/array.js";
import { $Uint53 } from "kryo/lib/integer.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

/**
 * Interface describing the content of the JWT acting as the oauth authorization grant code.
 *
 * It is based on the following draft: https://tools.ietf.org/html/draft-bradley-oauth-jwt-encoded-state-00
 */
export interface OauthCodeJwt {
  /**
   * Identifier representing the server granting the access code.
   *
   * It is always the `etwin` string.
   */
  issuer: "etwin";

  /**
   * User id
   */
  subject: string;

  /**
   * The client who was granted the JWT.
   * For external clients, the array only has their id.
   * For system clients, the array contains their id and their key.
   */
  audience: string[];

  scopes: string[];

  issuedAt: number;

  expirationTime: number;
}

export const $OauthCodeJwt: RecordIoType<OauthCodeJwt> = new RecordType<OauthCodeJwt>({
  properties: {
    issuer: {type: new LiteralType({type: $Ucs2String, value: "etwin"}), rename: "iss"},
    subject: {type: $Ucs2String, rename: "sub"},
    audience: {type: new ArrayType({itemType: $Ucs2String, maxLength: 2}), rename: "aud"},
    scopes: {type: new ArrayType({itemType: $Ucs2String, maxLength: 100})},
    issuedAt: {type: $Uint53, rename: "iat"},
    expirationTime: {type: $Uint53, rename: "exp"},
  },
});
