import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $Url, Url } from "../core/url.js";
import { $OauthClientSecret, OauthClientSecret } from "./oauth-client-secret.js";
import { $OauthCode, OauthCode } from "./oauth-code.js";
import { $OauthGrantType, OauthGrantType } from "./oauth-grant-type.js";
import { $RfcOauthClientId, RfcOauthClientId } from "./rfc-oauth-client-id.js";

/**
 * RFC-compliant token request.
 *
 * Use `EtwinOauthAccessTokenRequest` the more specific Etwin variant.
 */
export interface RfcOauthAccessTokenRequest {
  clientId?: RfcOauthClientId;
  clientSecret?: OauthClientSecret;
  redirectUri?: Url;
  code: OauthCode;
  grantType: OauthGrantType.AuthorizationCode;
}

export const $RfcOauthAccessTokenRequest: RecordIoType<RfcOauthAccessTokenRequest> = new RecordType<RfcOauthAccessTokenRequest>({
  properties: {
    clientId: {type: $RfcOauthClientId, optional: true},
    clientSecret: {type: $OauthClientSecret, optional: true},
    redirectUri: {type: $Url, optional: true},
    code: {type: $OauthCode},
    grantType: {type: new LiteralType({type: $OauthGrantType, value: OauthGrantType.AuthorizationCode})},
  },
  changeCase: CaseStyle.SnakeCase,
});
