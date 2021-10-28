import { $Url, Url } from "@eternal-twin/core/core/url";
import { $OauthAccessToken, OauthAccessToken } from "@eternal-twin/core/oauth/oauth-access-token";
import { OauthGrantType } from "@eternal-twin/core/oauth/oauth-grant-type";
import {
  $RfcOauthAccessTokenRequest,
  RfcOauthAccessTokenRequest
} from "@eternal-twin/core/oauth/rfc-oauth-access-token-request";
import authHeader from "auth-header";
import { Buffer } from "buffer";
import { JSON_VALUE_READER } from "kryo-json/json-value-reader";
import { JSON_VALUE_WRITER } from "kryo-json/json-value-writer";
import superagent from "superagent";

export interface RfcOauthClientOptions {
  authorizationEndpoint: Url;
  tokenEndpoint: Url;
  callbackEndpoint: Url;
  clientId: string;
  clientSecret: string;
}

export class RfcOauthClient {
  readonly #authorizationEndpoint: Url;
  readonly #tokenEndpoint: Url;
  readonly #callbackEndpoint: Url;
  readonly #clientId: string;
  readonly #clientSecret: string;

  public constructor(options: Readonly<RfcOauthClientOptions>) {
    this.#authorizationEndpoint = Object.freeze(new Url(options.authorizationEndpoint.toString()));
    this.#tokenEndpoint = Object.freeze(new Url(options.tokenEndpoint.toString()));
    this.#callbackEndpoint = Object.freeze(new Url(options.callbackEndpoint.toString()));
    this.#clientId = options.clientId;
    this.#clientSecret = options.clientSecret;
  }

  public getAuthorizationUri(scope: string, state: string): Url {
    const url: Url = new Url(this.#authorizationEndpoint.toString());
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", this.#callbackEndpoint.toString());
    url.searchParams.set("client_id", this.#clientId);
    url.searchParams.set("scope", scope);
    url.searchParams.set("state", state);
    return url;
  }

  public async getAccessToken(code: string): Promise<OauthAccessToken> {
    const accessTokenReq: RfcOauthAccessTokenRequest = {
      clientId: this.#clientId,
      clientSecret: this.#clientSecret,
      redirectUri: $Url.clone(this.#callbackEndpoint),
      code,
      grantType: OauthGrantType.AuthorizationCode,
    };
    const rawReq = $RfcOauthAccessTokenRequest.write(JSON_VALUE_WRITER, accessTokenReq);
    let rawRes: superagent.Response;
    try {
      rawRes = await superagent.post(this.#tokenEndpoint.toString())
        .set("Authorization", this.getAuthorizationHeader())
        .type("application/x-www-form-urlencoded")
        .send(rawReq);
    } catch (err) {
      switch ((err as any).status) {
        case 404:
          throw new Error(`UnreachableGrantUri: Resource not found: ${this.#tokenEndpoint}`);
        case 500:
          throw new Error("UnreachableGrantUri: Authorization server error");
        default:
          throw err;
      }
    }
    // Some OAuth providers (e.g. Twinoid) fail to set the response content-type to `application/json` despite senging
    // a JSON response. This prevents superagent from parsing the body automatically. The code below tries to parse
    // the response as JSON even if the content-type is `text/html`.
    let parsedBody: object | undefined;
    if (rawRes.type === "application/json") {
      parsedBody = rawRes.body;
    } else if (rawRes.type === "text/html") {
      try {
        parsedBody = JSON.parse(rawRes.text);
      } catch {
        // Ignore parse error, it just means that the response was really not JSON
      }
    }
    if (parsedBody === undefined) {
      throw new Error("UnexpectedGrantUriResponse: Failed to parse response");
    }
    let accessToken: OauthAccessToken;
    try {
      accessToken = $OauthAccessToken.read(JSON_VALUE_READER, parsedBody);
    } catch (err) {
      throw new Error(`UnexpectedGrantUriResponse: ${JSON.stringify(parsedBody)}`);
    }
    return accessToken;
  }

  private getAuthorizationHeader(): string {
    const credentials: string = `${this.#clientId}:${this.#clientSecret}`;
    const token: string = Buffer.from(credentials).toString("base64");
    const header: string = authHeader.format({scheme: "Basic", token});
    return header;
  }
}
