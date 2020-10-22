import url from "url";

import { EtwinOauthStateAndAccessToken } from "./etwin/etwin-oauth-state-and-access-token.js";
import { EtwinOauthStateInput } from "./etwin/etwin-oauth-state-input.js";
import { OauthCode } from "./oauth-code.js";
import { OauthScope } from "./oauth-scope.js";
import { OauthState } from "./oauth-state.js";

export interface OauthClientService {
  createAuthorizationRequest(state: EtwinOauthStateInput, scopes: readonly OauthScope[]): Promise<url.URL>;

  getAccessToken(rawState: OauthState, code: OauthCode): Promise<EtwinOauthStateAndAccessToken>;
}
