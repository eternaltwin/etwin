import { $Uint53 } from "kryo/lib/integer.js";
import { RecordIoType } from "kryo/lib/record.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

import { $EtwinOauthStateInput, EtwinOauthStateInput } from "./etwin-oauth-state-input.js";

/**
 * Interface describing the content of the `state` parameter as used by Eternal-Twin.
 *
 * It is based on the following draft: https://tools.ietf.org/html/draft-bradley-oauth-jwt-encoded-state-00
 */
export interface EtwinOauthState extends EtwinOauthStateInput {
  /**
   * Posix timestamp in secondes from the unix epoch for the issuance time.
   */
  issuedAt: number;

  /**
   * String identifying the authorization server corresponding to the request.
   */
  authorizationServer: string;

  /**
   * Posix timestamp in secondes from the unix epoch for the expiration time.
   */
  expirationTime: number;
}

export const $EtwinOauthState: RecordIoType<EtwinOauthState> = $EtwinOauthStateInput.extend({
  properties: {
    issuedAt: {type: $Uint53, rename: "iat"},
    authorizationServer: {type: $Ucs2String, rename: "as"},
    expirationTime: {type: $Uint53, rename: "exp"},
  },
});
