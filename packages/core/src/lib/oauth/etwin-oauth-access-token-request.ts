import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $Url, Url } from "../core/url.js";
import { $OauthClientInputRef, OauthClientInputRef } from "./oauth-client-input-ref.js";
import { $OauthClientSecret, OauthClientSecret } from "./oauth-client-secret.js";
import { $OauthCode, OauthCode } from "./oauth-code.js";
import { $OauthGrantType, OauthGrantType } from "./oauth-grant-type.js";

/**
 * OAuth access token request **specific to Eternal-Twin**.
 *
 * The `client_id` value is checked to be a client id as used by Eternal-Twin.
 *
 * Use `RfcOauthAccessTokenRequest` the more general oauth access token request.
 */
export interface EtwinOauthAccessTokenRequest {
  clientId?: OauthClientInputRef;
  clientSecret?: OauthClientSecret;
  redirectUri?: Url;
  code: OauthCode;
  grantType: OauthGrantType.AuthorizationCode;
}

export const $EtwinOauthAccessTokenRequest: RecordIoType<EtwinOauthAccessTokenRequest> = new RecordType<EtwinOauthAccessTokenRequest>({
  properties: {
    clientId: {type: $OauthClientInputRef, optional: true},
    clientSecret: {type: $OauthClientSecret, optional: true},
    redirectUri: {type: $Url, optional: true},
    code: {type: $OauthCode},
    grantType: {type: new LiteralType({type: $OauthGrantType, value: OauthGrantType.AuthorizationCode})},
  },
  changeCase: CaseStyle.SnakeCase,
});
