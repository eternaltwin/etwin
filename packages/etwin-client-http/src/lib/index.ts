import { $AuthContext, AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { EtwinClientService } from "@eternal-twin/core/lib/etwin-client/service.js";
import { OauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/oauth-access-token-key.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { $UserRef, UserRef } from "@eternal-twin/core/lib/user/user-ref.js";
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

  public async getAuthSelf(accessToken: OauthAccessTokenKey): Promise<AuthContext> {
    return this.get(accessToken, ["auth", "self"], $AuthContext);
  }

  public async getUserById(accessToken: OauthAccessTokenKey | null, userId: UserId): Promise<UserRef> {
    return this.get(accessToken, ["user", userId], $UserRef);
  }

  private async get<R>(
    accessToken: OauthAccessTokenKey | null,
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
    accessToken: OauthAccessTokenKey | null,
  ): superagent.SuperAgentRequest {
    if (accessToken === null) {
      return req;
    } else {
      return req.set("Authorization", this.getAuthorizationHeader(accessToken));
    }
  }

  private getAuthorizationHeader(accessToken: OauthAccessTokenKey): string {
    return `Bearer ${accessToken}`;
  }

  private resolveUri(components: readonly string[]): string {
    return urlJoin(this.apiUri.toString(), ...components);
  }
}
