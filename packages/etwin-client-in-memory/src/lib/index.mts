import { AuthContext } from "@eternal-twin/core/auth/auth-context";
import { EtwinClientService } from "@eternal-twin/core/etwin-client/service";
import { RfcOauthAccessTokenKey } from "@eternal-twin/core/oauth/rfc-oauth-access-token-key";
import { ShortUser } from "@eternal-twin/core/user/short-user";
import { UserId } from "@eternal-twin/core/user/user-id";

export class InMemoryEtwinClient implements EtwinClientService {
  constructor() {
  }

  public async getAuthSelf(_accessToken: RfcOauthAccessTokenKey): Promise<AuthContext> {
    throw new Error("NotImplemented");
  }

  public async getUserById(_accessToken: RfcOauthAccessTokenKey | null, _userId: UserId): Promise<ShortUser> {
    throw new Error("NotImplemented");
  }
}
