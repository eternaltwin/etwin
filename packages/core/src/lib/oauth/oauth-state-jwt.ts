import { $Uint53 } from "kryo/lib/integer.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

/**
 * Interface describing the content of the `state` parameter as used by Eternal-Twin.
 *
 * It is based on the following draft: https://tools.ietf.org/html/draft-bradley-oauth-jwt-encoded-state-00
 */
export interface OauthStateJwt {
  /**
   * String used for XSRF protection.
   * TODO: Probably derived from the `XSRF-TOKEN` cookie.
   */
  requestForgeryProtection: string;

  issuedAt: number;

  /**
   * String identifying the authorization server corresponding to the request.
   */
  authorizationServer: string;

  expirationTime: number;
}

export const $OauthStateJwt: RecordIoType<OauthStateJwt> = new RecordType<OauthStateJwt>({
  properties: {
    requestForgeryProtection: {type: $Ucs2String, rename: "rfp"},
    issuedAt: {type: $Uint53, rename: "iat"},
    authorizationServer: {type: $Ucs2String, rename: "as"},
    expirationTime: {type: $Uint53, rename: "exp"},
  },
});
