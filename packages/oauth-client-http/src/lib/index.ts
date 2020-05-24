import {
  $OauthAccessTokenRequest,
  OauthAccessTokenRequest,
} from "@eternal-twin/core/lib/oauth/oauth-access-token-request.js";
import { $OauthAccessToken, OauthAccessToken } from "@eternal-twin/core/lib/oauth/oauth-access-token.js";
import { OauthClientId } from "@eternal-twin/core/lib/oauth/oauth-client-id.js";
import { OauthClientSecret } from "@eternal-twin/core/lib/oauth/oauth-client-secret.js";
import { OauthCode } from "@eternal-twin/core/lib/oauth/oauth-code.js";
import { OauthGrantType } from "@eternal-twin/core/lib/oauth/oauth-grant-type.js";
import { OauthState } from "@eternal-twin/core/lib/oauth/oauth-state.js";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";
import superagent from "superagent";
import url from "url";

export interface OauthClientService {
  createAuthorizationRequest(state: OauthState): Promise<url.URL>;

  getAccessToken(code: OauthCode): Promise<OauthAccessToken>;
}

export class HttpOauthClientService implements OauthClientService {
  private readonly loginUri: url.URL;
  private readonly grantUri: url.URL;
  private readonly callbackUri: url.URL;
  private readonly clientId: OauthClientId;
  private readonly clientSecret: OauthClientSecret;

  constructor(clientId: OauthClientId, clientSecret: OauthClientSecret, callbackUri: url.URL) {
    this.loginUri = Object.freeze(new url.URL("https://twinoid.com/oauth/auth"));
    this.grantUri = Object.freeze(new url.URL("https://twinoid.com/oauth/token"));
    this.callbackUri = Object.freeze(new url.URL(callbackUri.toString()));
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  public async createAuthorizationRequest(state: OauthState): Promise<url.URL> {
    const reqUrl: url.URL = new url.URL(this.loginUri.toString());
    reqUrl.searchParams.set("response_type", "code");
    reqUrl.searchParams.set("client_id", this.clientId);
    reqUrl.searchParams.set("redirect_uri", this.callbackUri.toString());
    const scopes: string[] = [
      "contacts",
      "groups",
      "applications",
      "www.hordes.fr",
      "www.die2nite.com",
      "www.dieverdammten.de",
      "www.zombinoia.com",
      "mush.vg",
      "mush_ship_data",
      "arkadeo.com",
      "arkadeo_plays",
      "mush.twinoid.es",
      "mush.twinoid.com",
      "rockfaller.com",
      "www.dinorpg.com",
      "es.dinorpg.com",
      "en.dinorpg.com",
    ];
    reqUrl.searchParams.set("scope", scopes.join(","));
    reqUrl.searchParams.set("state", state);
    reqUrl.searchParams.set("access_type", "offline");
    return reqUrl;
  }

  public async getAccessToken(code: OauthCode): Promise<OauthAccessToken> {
    const accessTokenReq: OauthAccessTokenRequest = {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUri: this.callbackUri.toString(),
      code,
      grantType: OauthGrantType.AuthorizationCode,
    };
    const rawReq = $OauthAccessTokenRequest.write(JSON_VALUE_WRITER, accessTokenReq);
    const rawRes = await superagent.post(this.grantUri.toString()).send(rawReq);
    return $OauthAccessToken.read(JSON_VALUE_READER, rawRes);
  }
}
