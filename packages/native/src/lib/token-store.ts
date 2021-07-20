import { ObjectType } from "@eternal-twin/core/lib/core/object-type";
import { $DinoparcServer, DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server";
import { $DinoparcSessionKey, DinoparcSessionKey } from "@eternal-twin/core/lib/dinoparc/dinoparc-session-key";
import { DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id";
import { $DinoparcUserIdRef } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id-ref";
import {
  $NullableStoredDinoparcSession,
  $StoredDinoparcSession,
  NullableStoredDinoparcSession,
  StoredDinoparcSession
} from "@eternal-twin/core/lib/dinoparc/stored-dinoparc-session";
import { $HammerfestServer, HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server";
import { $HammerfestSessionKey, HammerfestSessionKey } from "@eternal-twin/core/lib/hammerfest/hammerfest-session-key";
import { HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id";
import { $HammerfestUserIdRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id-ref";
import {
  $NullableStoredHammerfestSession, $StoredHammerfestSession,
  NullableStoredHammerfestSession, StoredHammerfestSession
} from "@eternal-twin/core/lib/hammerfest/stored-hammerfest-session";
import {
  $RfcOauthAccessTokenKey,
  RfcOauthAccessTokenKey
} from "@eternal-twin/core/lib/oauth/rfc-oauth-access-token-key";
import {
  $RfcOauthRefreshTokenKey,
  RfcOauthRefreshTokenKey
} from "@eternal-twin/core/lib/oauth/rfc-oauth-refresh-token-key";
import { TokenService } from "@eternal-twin/core/lib/token/service";
import {
  $TouchOauthTokenOptions,
  TouchOauthTokenOptions
} from "@eternal-twin/core/lib/token/touch-oauth-token-options";
import { $TwinoidOauth, TwinoidOauth } from "@eternal-twin/core/lib/token/twinoid-oauth";
import { TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id";
import { $TwinoidUserIdRef } from "@eternal-twin/core/lib/twinoid/twinoid-user-id-ref";
import { JSON_READER } from "kryo-json/json-reader";
import { JSON_WRITER } from "kryo-json/json-writer";
import { promisify } from "util";

import native from "../native/index.js";
import { NativeClock } from "./clock.js";
import { Database } from "./database.js";

declare const MemTokenStoreBox: unique symbol;
declare const PgTokenStoreBox: unique symbol;
export type NativeTokenStoreBox = typeof MemTokenStoreBox | typeof PgTokenStoreBox;

export abstract class NativeTokenStore implements TokenService {
  public readonly box: NativeTokenStoreBox;
  private static TOUCH_TWINOID_OAUTH = promisify(native.tokenStore.touchTwinoidOauth);
  private static REVOKE_TWINOID_ACCESS_TOKEN = promisify(native.tokenStore.revokeTwinoidAccessToken);
  private static REVOKE_TWINOID_REFRESH_TOKEN = promisify(native.tokenStore.revokeTwinoidRefreshToken);
  private static GET_TWINOID_OAUTH = promisify(native.tokenStore.getTwinoidOauth);
  private static TOUCH_DINOPARC = promisify(native.tokenStore.touchDinoparc);
  private static REVOKE_DINOPARC = promisify(native.tokenStore.revokeDinoparc);
  private static GET_DINOPARC = promisify(native.tokenStore.getDinoparc);
  private static TOUCH_HAMMERFEST = promisify(native.tokenStore.touchHammerfest);
  private static REVOKE_HAMMERFEST = promisify(native.tokenStore.revokeHammerfest);
  private static GET_HAMMERFEST = promisify(native.tokenStore.getHammerfest);

  constructor(box: NativeTokenStoreBox) {
    this.box = box;
  }

  async touchTwinoidOauth(options: TouchOauthTokenOptions): Promise<void> {
    const rawOptions: string = $TouchOauthTokenOptions.write(JSON_WRITER, options);
    await NativeTokenStore.TOUCH_TWINOID_OAUTH(this.box, rawOptions);
  }

  async revokeTwinoidAccessToken(options: RfcOauthAccessTokenKey): Promise<void> {
    const rawOptions: string = $RfcOauthAccessTokenKey.write(JSON_WRITER, options);
    await NativeTokenStore.REVOKE_TWINOID_ACCESS_TOKEN(this.box, rawOptions);
  }

  async revokeTwinoidRefreshToken(options: RfcOauthRefreshTokenKey): Promise<void> {
    const rawOptions: string = $RfcOauthRefreshTokenKey.write(JSON_WRITER, options);
    await NativeTokenStore.REVOKE_TWINOID_REFRESH_TOKEN(this.box, rawOptions);
  }

  async getTwinoidOauth(id: TwinoidUserId): Promise<TwinoidOauth> {
    const rawOptions: string = $TwinoidUserIdRef.write(JSON_WRITER, {type: ObjectType.TwinoidUser, id});
    const rawOut = await NativeTokenStore.GET_TWINOID_OAUTH(this.box, rawOptions);
    return $TwinoidOauth.read(JSON_READER, rawOut);
  }

  async touchDinoparc(server: DinoparcServer, sessionKey: DinoparcSessionKey, userId: DinoparcUserId): Promise<StoredDinoparcSession> {
    const rawUser: string = $DinoparcUserIdRef.write(JSON_WRITER, {type: ObjectType.DinoparcUser, server, id: userId});
    const rawKey: string = $DinoparcSessionKey.write(JSON_WRITER, sessionKey);
    const rawOut = await NativeTokenStore.TOUCH_DINOPARC(this.box, rawUser, rawKey);
    return $StoredDinoparcSession.read(JSON_READER, rawOut);
  }

  async revokeDinoparc(dparcServer: DinoparcServer, sessionKey: DinoparcSessionKey): Promise<void> {
    const rawServer: string = $DinoparcServer.write(JSON_WRITER, dparcServer);
    const rawKey: string = $DinoparcSessionKey.write(JSON_WRITER, sessionKey);
    await NativeTokenStore.REVOKE_DINOPARC(this.box, rawServer, rawKey);
  }

  async getDinoparc(server: DinoparcServer, id: DinoparcUserId): Promise<NullableStoredDinoparcSession> {
    const rawOptions: string = $DinoparcUserIdRef.write(JSON_WRITER, {type: ObjectType.DinoparcUser, server, id});
    const rawOut = await NativeTokenStore.GET_DINOPARC(this.box, rawOptions);
    return $NullableStoredDinoparcSession.read(JSON_READER, rawOut);
  }

  async touchHammerfest(server: HammerfestServer, sessionKey: HammerfestSessionKey, userId: HammerfestUserId): Promise<StoredHammerfestSession> {
    const rawUser: string = $HammerfestUserIdRef.write(JSON_WRITER, {type: ObjectType.HammerfestUser, server, id: userId});
    const rawKey: string = $HammerfestSessionKey.write(JSON_WRITER, sessionKey);
    const rawOut = await NativeTokenStore.TOUCH_HAMMERFEST(this.box, rawUser, rawKey);
    return $StoredHammerfestSession.read(JSON_READER, rawOut);
  }

  async revokeHammerfest(hfServer: HammerfestServer, sessionKey: HammerfestSessionKey): Promise<void> {
    const rawServer: string = $HammerfestServer.write(JSON_WRITER, hfServer);
    const rawKey: string = $HammerfestSessionKey.write(JSON_WRITER, sessionKey);
    await NativeTokenStore.REVOKE_HAMMERFEST(this.box, rawServer, rawKey);
  }

  async getHammerfest(server: HammerfestServer, id: HammerfestUserId): Promise<NullableStoredHammerfestSession> {
    const rawOptions: string = $HammerfestUserIdRef.write(JSON_WRITER, {type: ObjectType.HammerfestUser, server, id});
    const rawOut = await NativeTokenStore.GET_HAMMERFEST(this.box, rawOptions);
    return $NullableStoredHammerfestSession.read(JSON_READER, rawOut);
  }
}

export interface MemTokenStoreOptions {
  clock: NativeClock;
}

export class MemTokenStore extends NativeTokenStore {
  constructor(options: Readonly<MemTokenStoreOptions>) {
    super(native.tokenStore.mem.new(options.clock.box));
  }
}

export interface PgTokenStoreOptions {
  clock: NativeClock;
  database: Database;
  databaseSecret: string;
}

export class PgTokenStore extends NativeTokenStore {
  private static NEW = promisify(native.tokenStore.pg.new);

  private constructor(box: typeof PgTokenStoreBox) {
    super(box);
  }

  public static async create(options: Readonly<PgTokenStoreOptions>): Promise<PgTokenStore> {
    const box = await PgTokenStore.NEW(options.clock.box, options.database.box, options.databaseSecret);
    return new PgTokenStore(box);
  }
}
