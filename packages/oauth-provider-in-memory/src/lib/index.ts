import { ClockService } from "@eternal-twin/core/lib/clock/service";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type";
import { Url } from "@eternal-twin/core/lib/core/url";
import { UuidGenerator } from "@eternal-twin/core/lib/core/uuid-generator";
import { CreateStoredOauthAccessTokenOptions } from "@eternal-twin/core/lib/oauth/create-stored-oauth-access-token-options";
import { OauthClient } from "@eternal-twin/core/lib/oauth/oauth-client";
import { OauthClientDisplayName } from "@eternal-twin/core/lib/oauth/oauth-client-display-name";
import { OauthClientId } from "@eternal-twin/core/lib/oauth/oauth-client-id";
import { OauthClientKey } from "@eternal-twin/core/lib/oauth/oauth-client-key";
import { OauthProviderStore } from "@eternal-twin/core/lib/oauth/provider-store";
import { RfcOauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/rfc-oauth-access-token-key";
import { StoredOauthAccessToken } from "@eternal-twin/core/lib/oauth/stored-oauth-access-token";
import { TouchStoredSystemClientOptions } from "@eternal-twin/core/lib/oauth/touch-stored-system-client-options";
import { PasswordHash } from "@eternal-twin/core/lib/password/password-hash";
import { PasswordService } from "@eternal-twin/core/lib/password/service";
import { NullableShortUser } from "@eternal-twin/core/lib/user/short-user";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { UuidHex } from "kryo/lib/uuid-hex";

export interface InMemoryOauthClient {
  id: OauthClientId;
  key: OauthClientKey | null;
  ctime: Date;
  displayName: ValueWithChanges<OauthClientDisplayName>;
  appUri: ValueWithChanges<Url>;
  callbackUri: ValueWithChanges<Url>;
  owner: NullableShortUser;
  passwordHash: ValueWithChanges<Uint8Array>;
}

export interface InMemoryAccessToken {
  id: UuidHex;
  clientId: OauthClientId;
  userId: UserId;
  ctime: Date;
  atime: Date;
  expirationTime: Date;
}

export interface ValueWithChanges<T> {
  latest: T;
  mtime: Date;
  changes: { value: T, startTime: Date }[];
}

export interface InMemoryOauthProviderStoreOptions {
  clock: ClockService;
  password: PasswordService;
  uuidGenerator: UuidGenerator;
}

export class InMemoryOauthProviderStore implements OauthProviderStore {
  readonly #clock: ClockService;
  readonly #password: PasswordService;
  readonly #uuidGenerator: UuidGenerator;

  readonly #clientsById: Map<OauthClientId, InMemoryOauthClient>;
  readonly #clientsByKey: Map<OauthClientKey, InMemoryOauthClient>;
  readonly #accessTokensById: Map<UuidHex, InMemoryAccessToken>;

  constructor(options: Readonly<InMemoryOauthProviderStoreOptions>) {
    this.#clock = options.clock;
    this.#password = options.password;
    this.#uuidGenerator = options.uuidGenerator;
    this.#clientsById = new Map();
    this.#clientsByKey = new Map();
    this.#accessTokensById = new Map();
  }

  public async getClientById(id: OauthClientId): Promise<OauthClient | null> {
    const imClient: InMemoryOauthClient | null = this.getImClientById(id);
    if (imClient === null) {
      return null;
    }
    return fromImClient(imClient);
  }

  public async getClientByKey(key: OauthClientKey): Promise<OauthClient | null> {
    const imClient: InMemoryOauthClient | null = this.getImClientByKey(key);
    if (imClient === null) {
      return null;
    }
    return fromImClient(imClient);
  }

  public async touchSystemClient(options: TouchStoredSystemClientOptions): Promise<OauthClient> {
    let imClient: InMemoryOauthClient | null = this.getImClientByKey(options.key);
    const time: Date = this.#clock.now();
    if (imClient === null) {
      const passwordHash: PasswordHash = await this.#password.hash(options.secret);
      const oauthClientId: OauthClientId = this.#uuidGenerator.next();
      imClient = {
        id: oauthClientId,
        key: options.key,
        displayName: {latest: options.displayName, mtime: new Date(time), changes: []},
        appUri: {latest: options.appUri, mtime: new Date(time), changes: []},
        callbackUri: {latest: options.callbackUri, mtime: new Date(time), changes: []},
        owner: null,
        ctime: new Date(time),
        passwordHash: {latest: passwordHash, mtime: new Date(time), changes: []},
      };
      this.addImClient(imClient);
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
      if (!(await this.#password.verify(imClient.passwordHash.latest, options.secret))) {
        const passwordHash: PasswordHash = await this.#password.hash(options.secret);
        imClient.passwordHash.changes.push({value: imClient.passwordHash.latest, startTime: imClient.passwordHash.mtime});
        imClient.passwordHash.latest = passwordHash;
        imClient.passwordHash.mtime = new Date(time);
      }
    }
    return fromImClient(imClient);
  }

  public async createAccessToken(options: Readonly<CreateStoredOauthAccessTokenOptions>): Promise<StoredOauthAccessToken> {
    const imAccessToken: InMemoryAccessToken = {
      id: options.key,
      ctime: new Date(options.ctime),
      atime: new Date(options.ctime),
      expirationTime: new Date(options.expirationTime),
      clientId: options.clientId,
      userId: options.userId,
    };
    this.addImAccessToken(imAccessToken);
    return fromImAccessToken(imAccessToken);
  }

  public async getAccessTokenByKey(key: RfcOauthAccessTokenKey): Promise<StoredOauthAccessToken | null> {
    const imAt = this.getImAccessTokenById(key);
    return imAt !== null ? fromImAccessToken(imAt) : null;
  }

  public async getAndTouchAccessTokenByKey(key: RfcOauthAccessTokenKey): Promise<StoredOauthAccessToken | null> {
    const imAt = this.getImAccessTokenById(key);
    if (imAt === null) {
      return null;
    }
    imAt.atime = this.#clock.now();
    return fromImAccessToken(imAt);
  }

  public async verifyClientSecret(id: OauthClientId, secret: Uint8Array): Promise<boolean> {
    const imClient = this.getImClientById(id);
    if (imClient === null) {
      throw new Error(`AssertionError: Expected Client ${id} to exist`);
    }
    return this.#password.verify(imClient.passwordHash.latest, secret);
  }

  private addImClient(imClient: InMemoryOauthClient): void {
    this.#clientsById.set(imClient.id, imClient);
    if (imClient.key !== null) {
      this.#clientsByKey.set(imClient.key, imClient);
    }
  }

  private getImClientById(id: OauthClientId): InMemoryOauthClient | null {
    return this.#clientsById.get(id) ?? null;
  }

  private getImClientByKey(key: OauthClientKey): InMemoryOauthClient | null {
    return this.#clientsByKey.get(key) ?? null;
  }

  private addImAccessToken(imAccessToken: InMemoryAccessToken): void {
    this.#accessTokensById.set(imAccessToken.id, imAccessToken);
  }

  private getImAccessTokenById(id: RfcOauthAccessTokenKey): InMemoryAccessToken | null {
    return this.#accessTokensById.get(id) ?? null;
  }
}

function fromImClient(imClient: InMemoryOauthClient): OauthClient {
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

function fromImAccessToken(imAccessToken: InMemoryAccessToken): StoredOauthAccessToken {
  return {
    client: {type: ObjectType.OauthClient, id: imAccessToken.clientId},
    user: {type: ObjectType.User, id: imAccessToken.userId},
    key: imAccessToken.id,
    ctime: new Date(imAccessToken.ctime),
    atime: new Date(imAccessToken.atime),
    expirationTime: new Date(imAccessToken.expirationTime),
  };
}
