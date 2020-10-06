import url from "url";

import { OauthAccessToken } from "./oauth-access-token.js";
import { OauthCode } from "./oauth-code.js";
import { OauthScope } from "./oauth-scope.js";
import { OauthState } from "./oauth-state.js";

export interface OauthClientService {
  createAuthorizationRequest(state: OauthState, scopes: readonly OauthScope[]): Promise<url.URL>;

  getAccessToken(code: OauthCode): Promise<OauthAccessToken>;

  createStateJwt(requestForgeryProtection: string, authorizationServer: string): Promise<string>;
}
