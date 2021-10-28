import { AuthContext } from "../auth/auth-context.mjs";
import { EtwinOauthAccessTokenKey } from "../oauth/etwin-oauth-access-token-key.mjs";
import { ShortUser } from "../user/short-user.mjs";
import { UserId } from "../user/user-id.mjs";

export interface EtwinClientService {
  getAuthSelf(accessToken: EtwinOauthAccessTokenKey): Promise<AuthContext>;

  getUserById(accessToken: EtwinOauthAccessTokenKey | null, userId: UserId): Promise<ShortUser>;
}
