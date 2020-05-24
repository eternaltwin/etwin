import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { Url } from "@eternal-twin/core/lib/core/url.js";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator.js";
import { CreateOrUpdateSystemClientOptions } from "@eternal-twin/core/lib/oauth/create-or-update-system-client-options.js";
import { OauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/oauth-access-token-key.js";
import { OauthAccessTokenRequest } from "@eternal-twin/core/lib/oauth/oauth-access-token-request.js";
import { OauthAccessToken } from "@eternal-twin/core/lib/oauth/oauth-access-token.js";
import { OauthClientDisplayName } from "@eternal-twin/core/lib/oauth/oauth-client-display-name.js";
import { OauthClientId } from "@eternal-twin/core/lib/oauth/oauth-client-id.js";
import { NullableOauthClientKey } from "@eternal-twin/core/lib/oauth/oauth-client-key";
import { OauthClientKey } from "@eternal-twin/core/lib/oauth/oauth-client-key.js";
import { OauthClient } from "@eternal-twin/core/lib/oauth/oauth-client.js";
import { OauthCode } from "@eternal-twin/core/lib/oauth/oauth-code.js";
import { OauthScopeString } from "@eternal-twin/core/lib/oauth/oauth-scope-string.js";
import { OauthScope } from "@eternal-twin/core/lib/oauth/oauth-scope.js";
import { OauthTokenType } from "@eternal-twin/core/lib/oauth/oauth-token-type.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service.js";
import { PasswordHash } from "@eternal-twin/core/lib/password/password-hash.js";
import { PasswordService } from "@eternal-twin/core/lib/password/service.js";
import { UserId } from "@eternal-twin/core/lib/user/user-id.js";
import { NullableUserRef } from "@eternal-twin/core/lib/user/user-ref.js";
import jsonWebToken from "jsonwebtoken";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader.js";
import { $UuidHex, UuidHex } from "kryo/lib/uuid-hex.js";

import { $OauthCodeJwt, OauthCodeJwt } from "./oauth-code-jwt.js";

export interface InMemoryOauthClient {
  id: OauthClientId;
  key: NullableOauthClientKey;
  ctime: Date;
  displayName: ValueWithChanges<OauthClientDisplayName>;
  appUri: ValueWithChanges<Url>;
  callbackUri: ValueWithChanges<Url>;
  owner: NullableUserRef;
  passwordHash: ValueWithChanges<Uint8Array>;
}

export interface InMemoryAccessToken {
  id: UuidHex;
  clientId: OauthClientId;
  userId: UserId;
  ctime: Date;
  atime: Date;
}

export interface ValueWithChanges<T> {
  latest: T;
  mtime: Date;
  changes: {value: T, startTime: Date}[];
}

export class InMemoryOauthProviderService implements OauthProviderService {
  private readonly uuidGen: UuidGenerator;
  private readonly password: PasswordService;
  private readonly tokenSecret: Buffer;

  private readonly clients: Set<InMemoryOauthClient>;
  private readonly accessTokens: Set<InMemoryAccessToken>;

  constructor(
    uuidGen: UuidGenerator,
    password: PasswordService,
    tokenSecret: Uint8Array,
  ) {
    this.uuidGen = uuidGen;
    this.password = password;
    this.tokenSecret = Buffer.from(tokenSecret);
    this.clients = new Set();
    this.accessTokens = new Set();
  }

  public async getClientByIdOrKey(_auth: AuthContext, idOrKey: OauthClientId | OauthClientKey): Promise<OauthClient | null> {
    const imClient: InMemoryOauthClient | null = this._getInMemoryClientByIdOrKey(idOrKey);
    if (imClient === null) {
      return null;
    }
    return {
      type: ObjectType.OauthClient,
      id: imClient.id,
      key: imClient.key,
      displayName: imClient.displayName.latest,
      appUri: imClient.appUri.latest,
      callbackUri: imClient.callbackUri.latest,
      owner: imClient.owner,
    };
  }

  public async createOrUpdateSystemClient(key: OauthClientKey, options: CreateOrUpdateSystemClientOptions): Promise<OauthClient> {
    let imClient: InMemoryOauthClient | null = this._getInMemoryClientByKey(key);
    const time: number = Date.now();
    if (imClient === null) {
      const passwordHash: PasswordHash = await this.password.hash(options.secret);
      const oauthClientId: UuidHex = this.uuidGen.next();
      imClient = {
        id: oauthClientId,
        key,
        displayName: {latest: options.displayName, mtime: new Date(time), changes: []},
        appUri: {latest: options.appUri, mtime: new Date(time), changes: []},
        callbackUri: {latest: options.callbackUri, mtime: new Date(time), changes: []},
        owner: null,
        ctime: new Date(time),
        passwordHash: {latest: passwordHash, mtime: new Date(time), changes: []},
      };
      this.clients.add(imClient);
    } else {
      if (imClient.displayName.latest !== options.displayName) {
        imClient.displayName.changes.push({value: imClient.displayName.latest, startTime: imClient.displayName.mtime});
        imClient.displayName.latest = options.displayName;
        imClient.displayName.mtime = new Date(time);
      }
      if (imClient.appUri.latest !== options.appUri) {
        imClient.appUri.changes.push({value: imClient.appUri.latest, startTime: imClient.appUri.mtime});
        imClient.appUri.latest = options.appUri;
        imClient.appUri.mtime = new Date(time);
      }
      if (imClient.callbackUri.latest !== options.callbackUri) {
        imClient.callbackUri.changes.push({value: imClient.callbackUri.latest, startTime: imClient.callbackUri.mtime});
        imClient.callbackUri.latest = options.callbackUri;
        imClient.callbackUri.mtime = new Date(time);
      }
      // TODO: Add support for password updates
    }
    return {
      type: ObjectType.OauthClient,
      id: imClient.id,
      key: imClient.key,
      displayName: imClient.displayName.latest,
      appUri: imClient.appUri.latest,
      callbackUri: imClient.callbackUri.latest,
      owner: imClient.owner,
    };
  }

  public async requestAuthorization(
    auth: AuthContext,
    clientId: OauthClientId,
    scopeString: OauthScopeString | null,
  ): Promise<OauthCode> {
    const scopes: ReadonlySet<OauthScope> = parseScopeString(scopeString);
    if (auth.type !== AuthType.User) {
      throw new Error("Unauthorized");
    }
    const client: OauthClient | null = await this.getClientByIdOrKey(auth, clientId);
    if (client === null) {
      throw new Error("ClientNotFound");
    }
    const missingScopes: Set<OauthScope> = new Set();
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

  public async createAccessToken(acx: AuthContext, req: OauthAccessTokenRequest): Promise<OauthAccessToken> {
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

    const accessTokenId: UuidHex = this.uuidGen.next();
    const ctime: number = Date.now();

    const imAccessToken: InMemoryAccessToken = {
      id: accessTokenId,
      ctime: new Date(ctime),
      atime: new Date(ctime),
      clientId: acx.client.id,
      userId: codeJwt.subject,
    };

    this.accessTokens.add(imAccessToken);

    return {
      accessToken: imAccessToken.id,
      expiresIn: 1e9, // TODO: Make it expire!
      tokenType: OauthTokenType.Bearer,
    };
  }

  /**
   * Create the JWT acting as the Oauth authorization code.
   */
  private async creatCodeJwt(
    clientId: OauthClientId,
    clientKey: OauthClientKey | null,
    userId: UserId,
    scopes: readonly OauthScope[],
  ) {
    const audience: string [] = [clientId];
    if (clientKey !== null) {
      audience.push(clientKey);
    }
    return jsonWebToken.sign(
      {scopes},
      this.tokenSecret,
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
      this.tokenSecret,
    );
    if (typeof codeObj !== "object" || codeObj === null) {
      throw new Error("AssertionError: Expected JWT verification result to be an object");
    }
    return $OauthCodeJwt.read(JSON_VALUE_READER, codeObj);
  }

  public _getInMemoryClientByIdOrKey(idOrKey: OauthClientId | OauthClientKey): InMemoryOauthClient | null {
    if ($UuidHex.test(idOrKey)) {
      return this._getInMemoryClientById(idOrKey);
    } else {
      return this._getInMemoryClientByKey(idOrKey);
    }
  }

  public _getInMemoryClientById(id: OauthClientId): InMemoryOauthClient | null {
    for (const client of this.clients) {
      if (client.id === id) {
        return client;
      }
    }
    return null;
  }

  private _getInMemoryClientByKey(key: OauthClientKey): InMemoryOauthClient | null {
    for (const client of this.clients) {
      if (client.key === key) {
        return client;
      }
    }
    return null;
  }

  public _getInMemoryAccessTokenById(id: OauthAccessTokenKey): InMemoryAccessToken | null {
    for (const token of this.accessTokens) {
      if (token.id === id) {
        return token;
      }
    }
    return null;
  }
}

export function parseScopeString(str: OauthScopeString | null): Set<OauthScope> {
  if (str === null) {
    str = "";
  }
  const rawScopes = str.split(" ")
    .map(x => x.trim())
    .filter(x => x.length > 0);
  const scopes: Set<OauthScope> = new Set();
  scopes.add("base");
  for (const rawScope of rawScopes) {
    if (rawScope !== "base") {
      throw new Error("InvalidScope");
    }
    scopes.add(rawScope);
  }
  return scopes;
}
