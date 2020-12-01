import { $AuthContext, AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { EtwinClientService } from "@eternal-twin/core/lib/etwin-client/service.js";
import { RfcOauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/rfc-oauth-access-token-key.js";
import { $ShortUser, ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { IoType } from "kryo";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import superagent from "superagent";
import url from "url";
import urlJoin from "url-join";

export class HttpEtwinClient implements EtwinClientService {
  private readonly apiUri: url.URL;

  constructor(apiUri: url.URL) {
    this.apiUri = Object.freeze(new url.URL(apiUri.toString()));
  }

  public async getAuthSelf(accessToken: RfcOauthAccessTokenKey): Promise<AuthContext> {
    return this.get(accessToken, ["auth", "self"], $AuthContext);
  }

  public async getUserById(accessToken: RfcOauthAccessTokenKey | null, userId: UserId): Promise<ShortUser> {
    return this.get(accessToken, ["users", userId], $ShortUser);
  }

  private async get<R>(
    accessToken: RfcOauthAccessTokenKey | null,
    route: readonly string[],
    resType: IoType<R>,
  ): Promise<R> {
    const uri = this.resolveUri(route);
    let rawRes: superagent.Response;
    try {
      rawRes = await this.setAuth(superagent.get(uri.toString()), accessToken).send();
    } catch (err) {
      switch (err.status) {
        case 404:
          throw new Error(`NotFound: GET ${uri}`);
        case 500:
          throw new Error(`ServerError: GET ${uri}`);
        default:
          throw err;
      }
    }
    let res: R;
    try {
      res = resType.read(JSON_VALUE_READER, rawRes.body);
    } catch (err) {
      console.log(err);
      throw new Error("UnexpectedResponseType");
    }
    return res;
  }

  private setAuth(
    req: superagent.SuperAgentRequest,
    accessToken: RfcOauthAccessTokenKey | null,
  ): superagent.SuperAgentRequest {
    if (accessToken === null) {
      return req;
    } else {
      return req.set("Authorization", this.getAuthorizationHeader(accessToken));
    }
  }

  private getAuthorizationHeader(accessToken: RfcOauthAccessTokenKey): string {
    return `Bearer ${accessToken}`;
  }

  private resolveUri(components: readonly string[]): string {
    return urlJoin(this.apiUri.toString(), "api/v1", ...components);
  }
}
