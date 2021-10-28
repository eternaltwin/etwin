import { DinoparcServer } from "../dinoparc/dinoparc-server.mjs";
import { DinoparcSessionKey } from "../dinoparc/dinoparc-session-key.mjs";
import { DinoparcUserId } from "../dinoparc/dinoparc-user-id.mjs";
import { NullableStoredDinoparcSession, StoredDinoparcSession } from "../dinoparc/stored-dinoparc-session.mjs";
import { HammerfestServer } from "../hammerfest/hammerfest-server.mjs";
import { HammerfestSessionKey } from "../hammerfest/hammerfest-session-key.mjs";
import { HammerfestUserId } from "../hammerfest/hammerfest-user-id.mjs";
import { NullableStoredHammerfestSession, StoredHammerfestSession } from "../hammerfest/stored-hammerfest-session.mjs";
import { RfcOauthAccessTokenKey } from "../oauth/rfc-oauth-access-token-key.mjs";
import { RfcOauthRefreshTokenKey } from "../oauth/rfc-oauth-refresh-token-key.mjs";
import { TwinoidUserId } from "../twinoid/twinoid-user-id.mjs";
import { TouchOauthTokenOptions } from "./touch-oauth-token-options.mjs";
import { TwinoidOauth } from "./twinoid-oauth.mjs";

/**
 * Service to store tokens to access remote data.
 *
 * For Hammerfest, we store session id keys. We assume that this key may be known by the outside world.
 * The authenticated Hammerfest user may change for the same session key: disconnecting and connecting to another user
 * account reuses the same key when using the Hammerfest website.
 * There can only be one session key per user.
 * The token service treats every change of currently logged user as a new session.
 */
export interface TokenService {
  touchTwinoidOauth(options: TouchOauthTokenOptions): Promise<void>;

  revokeTwinoidAccessToken(atKey: RfcOauthAccessTokenKey): Promise<void>;

  revokeTwinoidRefreshToken(rtKey: RfcOauthRefreshTokenKey): Promise<void>;

  getTwinoidOauth(tidUserId: TwinoidUserId): Promise<TwinoidOauth>;

  /**
   * Notifies the service of an active Dinoparc session.
   */
  touchDinoparc(dparcServer: DinoparcServer, sessionKey: DinoparcSessionKey, dparcUserId: DinoparcUserId): Promise<StoredDinoparcSession>;

  /**
   * Notifies the service of an inactive Dinoparc session.
   */
  revokeDinoparc(dparcServer: DinoparcServer, sessionKey: DinoparcSessionKey): Promise<void>;

  /**
   * Returns an active session for the provided Dinoparc user, if found.
   *
   * Note that the session's last known state is "authenticated as `dparcUserId`". If the session expired or was altered
   * externally, this may not correspond to its real state. The session may correspond to a guest or another user.
   */
  getDinoparc(dparcServer: DinoparcServer, dparcUserId: DinoparcUserId): Promise<NullableStoredDinoparcSession>;

  /**
   * Notifies the service of an active Hammerfest session.
   */
  touchHammerfest(hfServer: HammerfestServer, sessionKey: HammerfestSessionKey, hfUserId: HammerfestUserId): Promise<StoredHammerfestSession>;

  /**
   * Notifies the service of an inactive Hammerfest session.
   */
  revokeHammerfest(hfServer: HammerfestServer, sessionKey: HammerfestSessionKey): Promise<void>;

  /**
   * Returns an active session for the provided Hammerfest user, if found.
   *
   * Note that the session's last known state is "authenticated as `hfUserId`". If the session expired or was altered
   * externally, this may not correspond to its real state. The session may correspond to a guest or another user.
   */
  getHammerfest(hfServer: HammerfestServer, hfUserId: HammerfestUserId): Promise<NullableStoredHammerfestSession>;
}
