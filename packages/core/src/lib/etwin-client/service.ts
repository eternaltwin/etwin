import { AuthContext } from "../auth/auth-context.js";
import { OauthAccessTokenKey } from "../oauth/oauth-access-token-key.js";
import { ShortUser } from "../user/short-user.js";
import { UserId } from "../user/user-id.js";

export interface EtwinClientService {
  getAuthSelf(accessToken: OauthAccessTokenKey): Promise<AuthContext>;

  getUserById(accessToken: OauthAccessTokenKey | null, userId: UserId): Promise<ShortUser>;
}
