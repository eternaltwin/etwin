import { $OauthAccessToken, OauthAccessToken } from "@eternal-twin/core/lib/oauth/oauth-access-token.js";
import { OauthGrantType } from "@eternal-twin/core/lib/oauth/oauth-grant-type.js";
import {
  $RfcOauthAccessTokenRequest,
  RfcOauthAccessTokenRequest
} from "@eternal-twin/core/lib/oauth/rfc-oauth-access-token-request.js";
import authHeader from "auth-header";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";
import superagent from "superagent";
import { URL } from "url";

export interface RfcOauthClientOptions {
  authorizationEndpoint: URL;
  tokenEndpoint: URL;
  callbackEndpoint: URL;
  clientId: string;
  clientSecret: string;
}

export class RfcOauthClient {
  readonly #authorizationEndpoint: URL;
  readonly #tokenEndpoint: URL;
  readonly #callbackEndpoint: URL;
  readonly #clientId: string;
  readonly #clientSecret: string;

  public constructor(options: Readonly<RfcOauthClientOptions>) {
    this.#authorizationEndpoint = Object.freeze(new URL(options.authorizationEndpoint.toString()));
    this.#tokenEndpoint = Object.freeze(new URL(options.tokenEndpoint.toString()));
    this.#callbackEndpoint = Object.freeze(new URL(options.callbackEndpoint.toString()));
    this.#clientId = options.clientId;
    this.#clientSecret = options.clientSecret;
  }

  public getAuthorizationUri(scope: string, state: string): URL {
    const url: URL = new URL(this.#authorizationEndpoint.toString());
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
      redirectUri: this.#callbackEndpoint.toString(),
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
      switch (err.status) {
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
