import jsonWebToken from "jsonwebtoken";
import { ArrayType } from "kryo/array";
import { $Uint53 } from "kryo/integer";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";
import { $Ucs2String } from "kryo/ucs2-string";
import { UuidHex } from "kryo/uuid-hex";
import { JSON_VALUE_READER } from "kryo-json/json-value-reader";

import { AuthContext } from "../auth/auth-context.js";
import { AuthType } from "../auth/auth-type.js";
import { ClockService } from "../clock/service.js";
import { UuidGenerator } from "../core/uuid-generator.js";
import { ShortUser } from "../user/short-user.js";
import { SHORT_USER_FIELDS } from "../user/short-user-fields.js";
import { UserStore } from "../user/store.js";
import { UserId } from "../user/user-id.js";
import { UserIdRef } from "../user/user-id-ref";
import { CompleteOauthAccessToken } from "./complete-oauth-access-token.js";
import { CreateOrUpdateSystemClientOptions } from "./create-or-update-system-client-options.js";
import { EtwinOauthAccessTokenRequest } from "./etwin-oauth-access-token-request.js";
import { parseScopeString, toOauthClientTypedKey } from "./helpers.js";
import { OauthAccessToken } from "./oauth-access-token.js";
import { OauthClient } from "./oauth-client.js";
import { $OauthClientId, OauthClientId } from "./oauth-client-id.js";
import { OauthClientIdRef } from "./oauth-client-id-ref";
import { OauthClientInputRef } from "./oauth-client-input-ref.js";
import { OauthClientKey } from "./oauth-client-key.js";
import { OauthCode } from "./oauth-code.js";
import { OauthScopeString } from "./oauth-scope-string.js";
import { OauthTokenType } from "./oauth-token-type.js";
import { OauthProviderStore } from "./provider-store.js";
import { RfcOauthAccessTokenKey } from "./rfc-oauth-access-token-key.js";
import { RfcOauthScope } from "./rfc-oauth-scope.js";
import { ShortOauthClient } from "./short-oauth-client.js";
import { StoredOauthAccessToken } from "./stored-oauth-access-token.js";

export interface OauthProviderService {
  getClientByIdOrKey(_acx: AuthContext, inputRef: OauthClientInputRef): Promise<OauthClient | null>;

  createOrUpdateSystemClient(key: OauthClientKey, options: CreateOrUpdateSystemClientOptions): Promise<OauthClient>;

  createAuthorizationCode(
    auth: AuthContext,
    clientId: OauthClientId,
    scopeString: OauthScopeString | null,
  ): Promise<OauthCode>;

  createAccessToken(acx: AuthContext, req: EtwinOauthAccessTokenRequest): Promise<OauthAccessToken>;

  getAndTouchAccessToken(_acx: AuthContext, tokenKey: RfcOauthAccessTokenKey): Promise<{token: OauthAccessToken, client: OauthClientIdRef, user: UserIdRef} | null>;

  getAccessTokenByKey(_acx: AuthContext, atKey: RfcOauthAccessTokenKey): Promise<CompleteOauthAccessToken | null>;

  verifyClientSecret(_acx: AuthContext, clientId: OauthClientId, secret: Uint8Array): Promise<boolean>;
}

export interface DefaultOauthProviderServiceOptions {
  clock: ClockService;
  oauthProviderStore: OauthProviderStore;
  userStore: UserStore;
  tokenSecret: Uint8Array;
  uuidGenerator: UuidGenerator;
}

export class DefaultOauthProviderService implements OauthProviderService {
  readonly #clock: ClockService;
  readonly #oauthProviderStore: OauthProviderStore;
  readonly #userStore: UserStore;
  readonly #tokenSecret: Buffer;
  readonly #uuidGenerator: UuidGenerator;

  constructor(options: Readonly<DefaultOauthProviderServiceOptions>) {
    this.#clock = options.clock;
    this.#oauthProviderStore = options.oauthProviderStore;
    this.#userStore = options.userStore;
    this.#tokenSecret = Buffer.from(options.tokenSecret);
    this.#uuidGenerator = options.uuidGenerator;
  }

  public async getClientByIdOrKey(_acx: AuthContext, inputRef: OauthClientInputRef): Promise<OauthClient | null> {
    let client: OauthClient | null;
    if ($OauthClientId.test(inputRef)) {
      client = await this.#oauthProviderStore.getClientById(inputRef);
    } else {
      client = await this.#oauthProviderStore.getClientByKey(toOauthClientTypedKey(inputRef));
    }
    return client;
  }

  public async createOrUpdateSystemClient(key: OauthClientKey, options: CreateOrUpdateSystemClientOptions): Promise<OauthClient> {
    return this.#oauthProviderStore.touchSystemClient({
      key: toOauthClientTypedKey(key),
      displayName: options.displayName,
      appUri: options.appUri,
      callbackUri: options.callbackUri,
      secret: options.secret,
    });
  }

  /**
   * From a user authentication, create an authorization code for the provided client.
   */
  public async createAuthorizationCode(
    auth: AuthContext,
    clientId: OauthClientId,
    scopeString: OauthScopeString | null,
  ): Promise<OauthCode> {
    const scopes: ReadonlySet<RfcOauthScope> = parseScopeString(scopeString);
    if (auth.type !== AuthType.User) {
      throw new Error("Unauthorized");
    }
    const client: OauthClient | null = await this.getClientByIdOrKey(auth, clientId);
    if (client === null) {
      throw new Error("ClientNotFound");
    }
    const missingScopes: Set<RfcOauthScope> = new Set();
    if (client.owner === null) {
      // System client (authorize all without asking the user).
    } else {
      // External client (check missing authorizations).
      for (const scope of scopes) {
        switch (scope) {
          case "base":
            throw new Error("NotImplemented: Check if the current user has allowed base access");
          default:
            throw new Error(`AssertionError: UnknownScope: ${scope}`);
        }
      }
    }
    if (missingScopes.size > 0) {
      const name: string = "PromptUserAuthorization";
      const description: string = `Missing scopes: ${[...missingScopes].join(" ")}`;
      const err = new Error(`${name}: ${description}`);
      err.name = name;
      Reflect.set(err, "missingScopes", missingScopes);
      throw err;
    }
    return this.creatCodeJwt(clientId, client.key, auth.user.id, [...scopes]);
  }

  public async createAccessToken(acx: AuthContext, req: EtwinOauthAccessTokenRequest): Promise<OauthAccessToken> {
    if (acx.type !== AuthType.OauthClient) {
      if (acx.type === AuthType.Guest) {
        throw new Error("Unauthorized");
      } else {
        throw new Error("Forbidden");
      }
    }
    const codeJwt: OauthCodeJwt = await this.readCodeJwt(req.code);
    // TODO: Check if `redirect_uri` matches
    if (!codeJwt.audience.includes(acx.client.id)) {
      throw new Error("Forbidden");
    }
    const key: UuidHex = this.#uuidGenerator.next();
    const ctime: Date = this.#clock.now();
    const expiresIn: number = 1e9; // TODO: Make it expire!
    const expirationTime: Date = new Date(ctime.getTime() + expiresIn);

    await this.#oauthProviderStore.createAccessToken({
      key, ctime, expirationTime, clientId: acx.client.id, userId: codeJwt.subject,
    });
    return {
      tokenType: OauthTokenType.Bearer,
      accessToken: key,
      expiresIn,
      refreshToken: undefined,
    };
  }

  public async getAndTouchAccessToken(_acx: AuthContext, tokenKey: RfcOauthAccessTokenKey): Promise<{token: OauthAccessToken, client: OauthClientIdRef, user: UserIdRef} | null> {
    const stored = await this.#oauthProviderStore.getAndTouchAccessTokenByKey(tokenKey);
    if (stored === null) {
      return null;
    }
    return {
      token: {
        tokenType: OauthTokenType.Bearer,
        accessToken: stored.key,
        expiresIn: Math.floor((stored.expirationTime.getTime() / 1000) - this.#clock.nowUnixS()),
        refreshToken: undefined,
      },
      client: stored.client,
      user: stored.user,
    };
  }

  public async getAccessTokenByKey(_acx: AuthContext, atKey: RfcOauthAccessTokenKey): Promise<CompleteOauthAccessToken | null> {
    // Also update atime
    const storedToken: StoredOauthAccessToken | null = await this.#oauthProviderStore.getAccessTokenByKey(atKey);
    if (storedToken === null) {
      return null;
    }
    const user: ShortUser | null = await this.#userStore.getUser({ref: {id: storedToken.user.id}, fields: SHORT_USER_FIELDS});
    const client: ShortOauthClient | null = await this.#oauthProviderStore.getClientById(storedToken.client.id);
    if (user === null || client === null) {
      throw new Error("NotFound: User or Client");
    }
    return {
      ...storedToken,
      user,
      client,
    };
  }

  public async verifyClientSecret(_acx: AuthContext, clientId: OauthClientId, secret: Uint8Array): Promise<boolean> {
    return this.#oauthProviderStore.verifyClientSecret(clientId, secret);
  }

  /**
   * Create the JWT acting as the Oauth authorization code.
   */
  private async creatCodeJwt(
    clientId: OauthClientId,
    clientKey: OauthClientKey | null,
    userId: UserId,
    scopes: readonly RfcOauthScope[],
  ) {
    const audience: string [] = [clientId];
    if (clientKey !== null) {
      audience.push(clientKey);
    }
    return jsonWebToken.sign(
      {scopes},
      this.#tokenSecret,
      {
        issuer: "etwin",
        subject: userId,
        audience,
        algorithm: "HS256",
        expiresIn: "5min",
      },
    );
  }

  private async readCodeJwt(code: string): Promise<OauthCodeJwt> {
    const codeObj: object | string = jsonWebToken.verify(
      code,
      this.#tokenSecret,
    );
    if (typeof codeObj !== "object" || codeObj === null) {
      throw new Error("AssertionError: Expected JWT verification result to be an object");
    }
    return $OauthCodeJwt.read(JSON_VALUE_READER, codeObj);
  }
}

/**
 * Interface describing the content of the JWT acting as the oauth authorization grant code.
 *
 * It is based on the following draft: https://tools.ietf.org/html/draft-bradley-oauth-jwt-encoded-state-00
 */
export interface OauthCodeJwt {
  /**
   * Identifier representing the server granting the access code.
   *
   * It is always the `etwin` string.
   */
  issuer: "etwin";

  /**
   * User id
   */
  subject: string;

  /**
   * The client who was granted the JWT.
   * For external clients, the array only has their id.
   * For system clients, the array contains their id and their key.
   */
  audience: string[];

  scopes: string[];

  issuedAt: number;

  expirationTime: number;
}

export const $OauthCodeJwt: RecordIoType<OauthCodeJwt> = new RecordType<OauthCodeJwt>({
  properties: {
    issuer: {type: new LiteralType({type: $Ucs2String, value: "etwin"}), rename: "iss"},
    subject: {type: $Ucs2String, rename: "sub"},
    audience: {type: new ArrayType({itemType: $Ucs2String, maxLength: 2}), rename: "aud"},
    scopes: {type: new ArrayType({itemType: $Ucs2String, maxLength: 100})},
    issuedAt: {type: $Uint53, rename: "iat"},
    expirationTime: {type: $Uint53, rename: "exp"},
  },
});
