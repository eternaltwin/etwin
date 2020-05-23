import { AuthContext } from "../auth/auth-context.js";
import { OauthAccessTokenKey } from "../oauth/oauth-access-token-key.js";
import { UserId } from "../user/user-id.js";
import { UserRef } from "../user/user-ref.js";

export interface EtwinClientService {
  getAuthSelf(accessToken: OauthAccessTokenKey): Promise<AuthContext>;

  getUserById(accessToken: OauthAccessTokenKey | null, userId: UserId): Promise<UserRef>;
}
