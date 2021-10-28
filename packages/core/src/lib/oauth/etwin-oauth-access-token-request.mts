import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $Url, Url } from "../core/url.mjs";
import { $OauthClientInputRef, OauthClientInputRef } from "./oauth-client-input-ref.mjs";
import { $OauthClientSecret, OauthClientSecret } from "./oauth-client-secret.mjs";
import { $OauthCode, OauthCode } from "./oauth-code.mjs";
import { $OauthGrantType, OauthGrantType } from "./oauth-grant-type.mjs";

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
