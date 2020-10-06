import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service.js";
import {
  $OauthAccessTokenRequest,
  OauthAccessTokenRequest
} from "@eternal-twin/core/lib/oauth/oauth-access-token-request.js";
import { $OauthAccessToken, OauthAccessToken } from "@eternal-twin/core/lib/oauth/oauth-access-token.js";
import { OauthClientId } from "@eternal-twin/core/lib/oauth/oauth-client-id.js";
import { OauthClientSecret } from "@eternal-twin/core/lib/oauth/oauth-client-secret.js";
import { OauthCode } from "@eternal-twin/core/lib/oauth/oauth-code.js";
import { OauthGrantType } from "@eternal-twin/core/lib/oauth/oauth-grant-type.js";
import { OauthScope } from "@eternal-twin/core/lib/oauth/oauth-scope.js";
import { OauthStateJwt } from "@eternal-twin/core/lib/oauth/oauth-state-jwt.js";
import { OauthState } from "@eternal-twin/core/lib/oauth/oauth-state.js";
import authHeader from "auth-header";
import jsonWebToken from "jsonwebtoken";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";
import superagent from "superagent";
import url from "url";

export class HttpOauthClientService implements OauthClientService {
  private readonly authorizationUri: url.URL;
  private readonly grantUri: url.URL;
  private readonly callbackUri: url.URL;
  private readonly clientId: OauthClientId;
  private readonly clientSecret: OauthClientSecret;
  private readonly tokenSecret: Buffer;

  constructor(authorizationUri: url.URL, grantUri: url.URL, clientId: OauthClientId, clientSecret: OauthClientSecret, callbackUri: url.URL, tokenSecret: Uint8Array) {
    this.authorizationUri = Object.freeze(new url.URL(authorizationUri.toString()));
    this.grantUri = Object.freeze(new url.URL(grantUri.toString()));
    this.callbackUri = Object.freeze(new url.URL(callbackUri.toString()));
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.tokenSecret = Buffer.from(tokenSecret);
  }

  public async createAuthorizationRequest(state: OauthState, scopes: readonly OauthScope[]): Promise<url.URL> {
    const reqUrl: url.URL = new url.URL(this.authorizationUri.toString());
    reqUrl.searchParams.set("response_type", "code");
    reqUrl.searchParams.set("client_id", this.clientId);
    reqUrl.searchParams.set("redirect_uri", this.callbackUri.toString());
    reqUrl.searchParams.set("scope", scopes.join(" "));
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
    let rawRes: superagent.Response;
    try {
      rawRes = await superagent.post(this.grantUri.toString())
        .set("Authorization", this.getAuthorizationHeader())
        .send(rawReq);
    } catch (err) {
      switch (err.status) {
        case 404:
          throw new Error(`UnreachableGrantUri: Resource not found: ${this.grantUri}`);
        case 500:
          throw new Error("UnreachableGrantUri: Authorization server error");
        default:
          throw err;
      }
    }
    let res: OauthAccessToken;
    try {
      res = $OauthAccessToken.read(JSON_VALUE_READER, rawRes.body);
    } catch (err) {
      throw new Error("UnexpectedGrantUriResponse");
    }
    return res;
  }

  public async createStateJwt(requestForgeryProtection: string, authorizationServer: string): Promise<string> {
    const payload: Omit<OauthStateJwt, "issuedAt" | "expirationTime"> = {
      authorizationServer,
      requestForgeryProtection,
    };
    return jsonWebToken.sign(
      payload,
      this.tokenSecret,
      {
        algorithm: "HS256",
        expiresIn: "1d",
      },
    );
  }

  private getAuthorizationHeader(): string {
    const credentials: string = `${this.clientId}:${this.clientSecret}`;
    const token: string = Buffer.from(credentials).toString("base64");
    return authHeader.format({scheme: "Basic", token});
  }
}
