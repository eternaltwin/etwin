import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { EtwinClientService } from "@eternal-twin/core/lib/etwin-client/service.js";
import { OauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/oauth-access-token-key.js";
import { ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";

export class InMemoryEtwinClient implements EtwinClientService {
  constructor() {
  }

  public async getAuthSelf(_accessToken: OauthAccessTokenKey): Promise<AuthContext> {
    throw new Error("NotImplemented");
  }

  public async getUserById(_accessToken: OauthAccessTokenKey | null, _userId: UserId): Promise<ShortUser> {
    throw new Error("NotImplemented");
  }
}
