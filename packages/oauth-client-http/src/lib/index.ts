import { ClockService } from "@eternal-twin/core/lib/clock/service.js";
import { OauthClientService } from "@eternal-twin/core/lib/oauth/client-service.js";
import { $EtwinOauthState } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-state.js";
import { EtwinOauthStateAndAccessToken } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-state-and-access-token";
import { EtwinOauthStateInput } from "@eternal-twin/core/lib/oauth/etwin/etwin-oauth-state-input.js";
import { OauthClientId } from "@eternal-twin/core/lib/oauth/oauth-client-id.js";
import { OauthClientSecret } from "@eternal-twin/core/lib/oauth/oauth-client-secret.js";
import { OauthCode } from "@eternal-twin/core/lib/oauth/oauth-code.js";
import { OauthState } from "@eternal-twin/core/lib/oauth/oauth-state.js";
import { RfcOauthScope } from "@eternal-twin/core/lib/oauth/rfc-oauth-scope.js";
import jsonWebToken from "jsonwebtoken";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer.js";
import url from "url";

import { RfcOauthClient } from "./rfc-oauth-client.js";
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
  readonly #rfcClient: RfcOauthClient;
  readonly #clock: ClockService;
  readonly #authorizationUri: url.URL;
  readonly #maxStateBytes: number;
  readonly #tokenSecret: Buffer;

  constructor(options: Readonly<HttpOauthClientServiceOptions>) {
    this.#rfcClient = new RfcOauthClient({
      authorizationEndpoint: options.authorizationUri,
      tokenEndpoint: options.grantUri,
      callbackEndpoint: options.callbackUri,
      clientId: options.clientId,
      clientSecret: options.clientSecret,
    });
    this.#clock = options.clock;
    this.#authorizationUri = Object.freeze(new url.URL(options.authorizationUri.toString()));
    this.#maxStateBytes = TWINOID_MAX_STATE_BYTES;
    this.#tokenSecret = Buffer.from(options.tokenSecret);
  }

  public async createAuthorizationRequest(
    state: EtwinOauthStateInput,
    scopes: readonly RfcOauthScope[]
  ): Promise<url.URL> {
    const stateJwt: OauthState = await this.createStateJwt(state);
    const shortJwt: string = await shrinkJwt(stateJwt);
    const inLimits: boolean = await this.testLimits({state: shortJwt});
    if (!inLimits) {
      throw new Error(`StateBeyondLimit: ${JSON.stringify(shortJwt)}`);
    }
    const scope: string = scopes.join(" ");
    return this.#rfcClient.getAuthorizationUri(scope, shortJwt);
  }

  public async getAccessToken(rawState: OauthState, code: OauthCode): Promise<EtwinOauthStateAndAccessToken> {
    const fullJwt: OauthState = await expandJwt(rawState);
    const rawStateObj = jsonWebToken.verify(fullJwt, this.#tokenSecret, {clockTimestamp: this.#clock.nowUnixS()});
    const state = $EtwinOauthState.read(JSON_VALUE_READER, rawStateObj);
    const accessToken = await this.#rfcClient.getAccessToken(code);
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

  public async testLimits(input: { readonly state: string }): Promise<boolean> {
    const utf8ByteCount: number = Buffer.from(input.state, "utf-8").length;
    return utf8ByteCount <= this.#maxStateBytes;
  }
}
