import url from "url";

import { EtwinOauthStateAndAccessToken } from "./etwin/etwin-oauth-state-and-access-token.js";
import { EtwinOauthStateInput } from "./etwin/etwin-oauth-state-input.js";
import { OauthCode } from "./oauth-code.js";
import { OauthState } from "./oauth-state.js";
import { RfcOauthScope } from "./rfc-oauth-scope.js";

export interface OauthClientService {
  createAuthorizationRequest(state: EtwinOauthStateInput, scopes: readonly RfcOauthScope[]): Promise<url.URL>;

  getAccessToken(rawState: OauthState, code: OauthCode): Promise<EtwinOauthStateAndAccessToken>;
}
