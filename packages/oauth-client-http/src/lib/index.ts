import { ClockService } from "@eternal-twin/core/lib/clock/service.js";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service.js";
import { $EtwinOauthState } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-state.js";
import { EtwinOauthStateAndAccessToken } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-state-and-access-token";
import { EtwinOauthStateInput } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-state-input.js";
import { $OauthAccessToken, OauthAccessToken } from "@eternal-twin/core/lib/oauth/oauth-access-token.js";
import {
  $OauthAccessTokenRequest,
  OauthAccessTokenRequest
} from "@eternal-twin/core/lib/oauth/oauth-access-token-request.js";
import { OauthClientId } from "@eternal-twin/core/lib/oauth/oauth-client-id.js";
import { OauthClientSecret } from "@eternal-twin/core/lib/oauth/oauth-client-secret.js";
import { OauthCode } from "@eternal-twin/core/lib/oauth/oauth-code.js";
import { OauthGrantType } from "@eternal-twin/core/lib/oauth/oauth-grant-type.js";
import { OauthState } from "@eternal-twin/core/lib/oauth/oauth-state.js";
import { RfcOauthScope } from "@eternal-twin/core/lib/oauth/rfc-oauth-scope.js";
import authHeader from "auth-header";
import jsonWebToken from "jsonwebtoken";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";
import superagent from "superagent";
import url from "url";

import { expandJwt, shrinkJwt } from "./shrink-jwt.js";

export interface HttpOauthClientServiceOptions {
  authorizationUri: url.URL;
  callbackUri: url.URL;
  clientId: OauthClientId;
  clientSecret: OauthClientSecret;
  clock: ClockService;
  grantUri: url.URL;
  tokenSecret: Uint8Array;
}

/**
 * 15 minutes in seconds.
 */
const FIFTEEN_MINUTES: number = 15 * 60;

/**
 * Twinoid has a limit on the length of the state string: 255 is accepted, 256 is rejected.
 * This constant corresponds to this limit.
 * The length is measured in UTF-8 bytes.
 */
const TWINOID_MAX_STATE_BYTES: number = 255;

export class HttpOauthClientService implements OauthClientService {
  readonly #clock: ClockService;
  readonly #authorizationUri: url.URL;
  readonly #grantUri: url.URL;
  readonly #callbackUri: url.URL;
  readonly #clientId: OauthClientId;
  readonly #clientSecret: OauthClientSecret;
  readonly #maxStateBytes: number;
  readonly #tokenSecret: Buffer;

  constructor(options: Readonly<HttpOauthClientServiceOptions>) {
    this.#clock = options.clock;
    this.#authorizationUri = Object.freeze(new url.URL(options.authorizationUri.toString()));
    this.#grantUri = Object.freeze(new url.URL(options.grantUri.toString()));
    this.#callbackUri = Object.freeze(new url.URL(options.callbackUri.toString()));
    this.#clientId = options.clientId;
    this.#clientSecret = options.clientSecret;
    this.#maxStateBytes = TWINOID_MAX_STATE_BYTES;
    this.#tokenSecret = Buffer.from(options.tokenSecret);
  }

  public async createAuthorizationRequest(state: EtwinOauthStateInput, scopes: readonly RfcOauthScope[]): Promise<url.URL> {
    const stateJwt: OauthState = await this.createStateJwt(state);
    const shortJwt: string = await shrinkJwt(stateJwt);
    const inLimits: boolean = await this.testLimits({state: shortJwt});
    if (!inLimits) {
      throw new Error(`StateBeyondLimit: ${JSON.stringify(shortJwt)}`);
    }
    const reqUrl: url.URL = new url.URL(this.#authorizationUri.toString());
    reqUrl.searchParams.set("response_type", "code");
    reqUrl.searchParams.set("client_id", this.#clientId);
    reqUrl.searchParams.set("redirect_uri", this.#callbackUri.toString());
    reqUrl.searchParams.set("scope", scopes.join(" "));
    reqUrl.searchParams.set("state", shortJwt);
    reqUrl.searchParams.set("access_type", "offline");
    return reqUrl;
  }

  public async getAccessToken(rawState: OauthState, code: OauthCode): Promise<EtwinOauthStateAndAccessToken> {
    const fullJwt: OauthState = await expandJwt(rawState);
    const rawStateObj = jsonWebToken.verify(fullJwt, this.#tokenSecret, {clockTimestamp: this.#clock.nowUnixS()});
    const state = $EtwinOauthState.read(JSON_VALUE_READER, rawStateObj);

    const accessTokenReq: OauthAccessTokenRequest = {
      clientId: this.#clientId,
      clientSecret: this.#clientSecret,
      redirectUri: this.#callbackUri.toString(),
      code,
      grantType: OauthGrantType.AuthorizationCode,
    };
    const rawReq = $OauthAccessTokenRequest.write(JSON_VALUE_WRITER, accessTokenReq);
    let rawRes: superagent.Response;
    try {
      rawRes = await superagent.post(this.#grantUri.toString())
        .set("Authorization", this.getAuthorizationHeader())
        .type("application/x-www-form-urlencoded")
        .send(rawReq);
    } catch (err) {
      switch (err.status) {
        case 404:
          throw new Error(`UnreachableGrantUri: Resource not found: ${this.#grantUri}`);
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
    return {state, accessToken};
  }

  public async createStateJwt(state: EtwinOauthStateInput): Promise<string> {
    const timeS: number = this.#clock.nowUnixS();
    const payload = $EtwinOauthState.write(
      JSON_VALUE_WRITER,
      {
        ...state,
        authorizationServer: this.#authorizationUri.host,
        issuedAt: timeS,
        expirationTime: timeS + FIFTEEN_MINUTES,
      },
    );
    return jsonWebToken.sign(
      payload,
      this.#tokenSecret,
      {
        algorithm: "HS256",
      },
    );
  }

  public async testLimits(input: {readonly state: string}): Promise<boolean> {
    const utf8ByteCount: number = Buffer.from(input.state, "utf-8").length;
    return utf8ByteCount <= this.#maxStateBytes;
  }

  private getAuthorizationHeader(): string {
    const credentials: string = `${this.#clientId}:${this.#clientSecret}`;
    const token: string = Buffer.from(credentials).toString("base64");
    const header: string = authHeader.format({scheme: "Basic", token});
    return header;
  }
}
