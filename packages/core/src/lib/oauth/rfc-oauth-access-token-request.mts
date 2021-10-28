import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $Url, Url } from "../core/url.mjs";
import { $OauthClientSecret, OauthClientSecret } from "./oauth-client-secret.mjs";
import { $OauthCode, OauthCode } from "./oauth-code.mjs";
import { $OauthGrantType, OauthGrantType } from "./oauth-grant-type.mjs";
import { $RfcOauthClientId, RfcOauthClientId } from "./rfc-oauth-client-id.mjs";

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
