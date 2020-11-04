import { AuthContext } from "../auth/auth-context.js";
import { EtwinOauthAccessTokenKey } from "../oauth/etwin-oauth-access-token-key.js";
import { ShortUser } from "../user/short-user.js";
import { UserId } from "../user/user-id.js";

export interface EtwinClientService {
  getAuthSelf(accessToken: EtwinOauthAccessTokenKey): Promise<AuthContext>;

  getUserById(accessToken: EtwinOauthAccessTokenKey | null, userId: UserId): Promise<ShortUser>;
}
