import { CaseStyle } from "kryo";
import { RecordIoType, RecordType } from "kryo/record";

import { $Url, Url } from "../core/url.mjs";
import { $OauthClientInputRef, OauthClientInputRef } from "./oauth-client-input-ref.mjs";
import { $OauthResponseType, OauthResponseType } from "./oauth-response-type.mjs";
import { $OauthScopeString, OauthScopeString } from "./oauth-scope-string.mjs";
import { $OauthState, OauthState } from "./oauth-state.mjs";

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
