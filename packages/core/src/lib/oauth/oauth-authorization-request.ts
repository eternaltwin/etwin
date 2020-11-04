import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $Url, Url } from "../core/url.js";
import { $OauthClientInputRef, OauthClientInputRef } from "./oauth-client-input-ref.js";
import { $OauthResponseType, OauthResponseType } from "./oauth-response-type.js";
import { $OauthScopeString, OauthScopeString } from "./oauth-scope-string.js";
import { $OauthState, OauthState } from "./oauth-state.js";

export interface OauthAuthorizationRequest {
  clientId: OauthClientInputRef;
  redirectUri?: Url;
  responseType: OauthResponseType;
  scope?: OauthScopeString;
  state?: OauthState;
}

export const $OauthAuthorizationRequest: RecordIoType<OauthAuthorizationRequest> = new RecordType<OauthAuthorizationRequest>({
  properties: {
    clientId: {type: $OauthClientInputRef},
    redirectUri: {type: $Url, optional: true},
    responseType: {type: $OauthResponseType},
    scope: {type: $OauthScopeString, optional: true},
    state: {type: $OauthState, optional: true},
  },
  changeCase: CaseStyle.SnakeCase,
});
