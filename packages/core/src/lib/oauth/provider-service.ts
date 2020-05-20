import { AuthContext } from "../auth/auth-context.js";
import { CreateOrUpdateSystemClientOptions } from "./create-or-update-system-client-options.js";
import { OauthAccessTokenRequest } from "./oauth-access-token-request.js";
import { OauthAccessToken } from "./oauth-access-token.js";
import { OauthClientId } from "./oauth-client-id.js";
import { OauthClientKey } from "./oauth-client-key.js";
import { OauthClient } from "./oauth-client.js";
import { OauthCode } from "./oauth-code.js";
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

  createOrUpdateSystemClient(key: OauthClientKey, options: CreateOrUpdateSystemClientOptions): Promise<OauthClient>;
}
