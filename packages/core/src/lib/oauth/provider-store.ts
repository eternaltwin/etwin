import { CreateStoredOauthAccessTokenOptions } from "./create-stored-oauth-access-token-options.js";
import { OauthClientId } from "./oauth-client-id.js";
import { OauthClientKey } from "./oauth-client-key.js";
import { OauthClient } from "./oauth-client.js";
import { RfcOauthAccessTokenKey } from "./rfc-oauth-access-token-key.js";
import { StoredOauthAccessToken } from "./stored-oauth-access-token.js";
import { TouchStoredSystemClientOptions } from "./touch-stored-system-client-options.js";

export interface OauthProviderStore {
  touchSystemClient(options: TouchStoredSystemClientOptions): Promise<OauthClient>;

  getClientById(id: OauthClientId): Promise<OauthClient | null>;

  getClientByKey(key: OauthClientKey): Promise<OauthClient | null>;

  verifyClientSecret(id: OauthClientId, secret: Uint8Array): Promise<boolean>;

  createAccessToken(options: Readonly<CreateStoredOauthAccessTokenOptions>): Promise<StoredOauthAccessToken>;

  getAccessTokenByKey(key: RfcOauthAccessTokenKey): Promise<StoredOauthAccessToken | null>;
}
