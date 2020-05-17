import { AuthContext } from "../auth/auth-context.js";
import { OauthAccessToken } from "./oauth-access-token";
import { OauthAccessTokenRequest } from "./oauth-access-token-request.js";
import { OauthClientId } from "./oauth-client-id.js";
import { OauthClientKey } from "./oauth-client-key.js";
import { OauthClient } from "./oauth-client.js";
import { OauthCode } from "./oauth-code";
import { OauthScopeString } from "./oauth-scope-string.js";

export interface OauthProviderService {
  getClientByIdOrKey(auth: AuthContext, id: OauthClientId | OauthClientKey): Promise<OauthClient | null>;

  requestAuthorization(
    auth: AuthContext,
    clientId: OauthClientId,
    scopeString: OauthScopeString | null,
  ): Promise<OauthCode>;

  createAccessToken(
    auth: AuthContext,
    req: OauthAccessTokenRequest,
  ): Promise<OauthAccessToken>;
}
