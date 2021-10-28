import { CreateStoredOauthAccessTokenOptions } from "./create-stored-oauth-access-token-options.mjs";
import { OauthClient } from "./oauth-client.mjs";
import { OauthClientId } from "./oauth-client-id.mjs";
import { OauthClientKey } from "./oauth-client-key.mjs";
import { RfcOauthAccessTokenKey } from "./rfc-oauth-access-token-key.mjs";
import { StoredOauthAccessToken } from "./stored-oauth-access-token.mjs";
import { TouchStoredSystemClientOptions } from "./touch-stored-system-client-options.mjs";

export interface OauthProviderStore {
  touchSystemClient(options: TouchStoredSystemClientOptions): Promise<OauthClient>;

  getClientById(id: OauthClientId): Promise<OauthClient | null>;

  getClientByKey(key: OauthClientKey): Promise<OauthClient | null>;

  verifyClientSecret(id: OauthClientId, secret: Uint8Array): Promise<boolean>;

  createAccessToken(options: Readonly<CreateStoredOauthAccessTokenOptions>): Promise<StoredOauthAccessToken>;

  getAccessTokenByKey(key: RfcOauthAccessTokenKey): Promise<StoredOauthAccessToken | null>;

  getAndTouchAccessTokenByKey(key: RfcOauthAccessTokenKey): Promise<StoredOauthAccessToken | null>;
}
