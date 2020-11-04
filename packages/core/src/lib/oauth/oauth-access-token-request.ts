import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $Url, Url } from "../core/url.js";
import { $OauthClientInputRef, OauthClientInputRef } from "./oauth-client-input-ref.js";
import { $OauthClientSecret, OauthClientSecret } from "./oauth-client-secret.js";
import { $OauthCode, OauthCode } from "./oauth-code.js";
import { $OauthGrantType, OauthGrantType } from "./oauth-grant-type.js";

export interface OauthAccessTokenRequest {
  clientId?: OauthClientInputRef;
  clientSecret?: OauthClientSecret;
  redirectUri?: Url;
  code: OauthCode;
  grantType: OauthGrantType.AuthorizationCode;
}

export const $OauthAccessTokenRequest: RecordIoType<OauthAccessTokenRequest> = new RecordType<OauthAccessTokenRequest>({
  properties: {
    clientId: {type: $OauthClientInputRef, optional: true},
    clientSecret: {type: $OauthClientSecret, optional: true},
    redirectUri: {type: $Url, optional: true},
    code: {type: $OauthCode},
    grantType: {type: new LiteralType({type: $OauthGrantType, value: OauthGrantType.AuthorizationCode})},
  },
  changeCase: CaseStyle.SnakeCase,
});
