import { ObjectType } from "@eternal-twin/core/lib/core/object-type";
import { HammerfestUserIdRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id-ref";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store";
import { StoredHammerfestSession } from "@eternal-twin/core/lib/hammerfest/stored-hammerfest-session";
import { TokenService } from "@eternal-twin/core/lib/token/service";
import { TwinoidOauth } from "@eternal-twin/core/lib/token/twinoid-oauth";
import { ShortTwinoidUser } from "@eternal-twin/core/lib/twinoid/short-twinoid-user";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store";
import { forceCreateLatest } from "@eternal-twin/etwin-pg";
import { getLocalConfig } from "@eternal-twin/local-config";
import { Database, DbConfig, withPgPool } from "@eternal-twin/pg-db";
import chai from "chai";

import { SystemClock } from "../lib/clock.js";
import { Database as NativeDatabase } from "../lib/database.js";
import { MemHammerfestStore, PgHammerfestStore } from "../lib/hammerfest-store.js";
import { MemTokenStore, PgTokenStore } from "../lib/token-store.js";
import { MemTwinoidStore, PgTwinoidStore } from "../lib/twinoid-store.js";
import { Uuid4Generator } from "../lib/uuid.js";

describe("NativeTokenStore", function () {
  describe("MemTokenStore", function () {
    async function withMemTokenStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
      const clock = new SystemClock();
      const hammerfestStore = new MemHammerfestStore({clock});
      const twinoidStore = new MemTwinoidStore({clock});
      const token = new MemTokenStore({clock});
      return fn({hammerfestStore, twinoidStore, token});
    }

    testTokenService(withMemTokenStore);
  });

  describe("PgTokenStore", function () {
    async function withPgLinkStore<R>(fn: (api: TestApi) => Promise<R>): Promise<R> {
      const config = await getLocalConfig();
      const adminDbConfig: DbConfig = {
        host: config.db.host,
        port: config.db.port,
        name: config.db.name,
        user: config.db.adminUser,
        password: config.db.adminPassword,
      };
      await withPgPool(adminDbConfig, async (pool) => {
        const database = new Database(pool);
        await forceCreateLatest(database);
      });

      const dbConfig: DbConfig = {
        host: config.db.host,
        port: config.db.port,
        name: config.db.name,
        user: config.db.user,
        password: config.db.password,
      };

      const nativeDatabase = await NativeDatabase.create(dbConfig);

      const clock = new SystemClock();
      const uuidGenerator = new Uuid4Generator();
      const secretKeyStr: string = config.etwin.secret;
      const hammerfestStore = await PgHammerfestStore.create({clock, database: nativeDatabase, databaseSecret: secretKeyStr, uuidGenerator});
      const twinoidStore = new PgTwinoidStore({clock, database: nativeDatabase});
      const token = await PgTokenStore.create({clock, database: nativeDatabase, databaseSecret: secretKeyStr});
      try {
        return await fn({hammerfestStore, twinoidStore, token});
      } finally {
        await nativeDatabase.close();
      }
    }

    testTokenService(withPgLinkStore);
  });
});

export interface TestApi {
  hammerfestStore: HammerfestStore;
  twinoidStore: TwinoidStore;
  token: TokenService;
}

export function testTokenService(withApi: (fn: (api: TestApi) => Promise<void>) => Promise<void>) {
  it("Touches a Twinoid oauth token", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const now: Date = new Date();
      const exp: Date = new Date(now.getTime() + 2 * 3600 * 1000);
      const alice: ShortTwinoidUser = {
        type: ObjectType.TwinoidUser,
        id: "1",
        displayName: "alice",
      };
      await api.twinoidStore.touchShortUser(alice);
      await api.token.touchTwinoidOauth({
        accessToken: "X6nhMR2zwwfLNOR6EoQ9cM03BI3i66Q6",
        expirationTime: new Date(now.getTime() + 3600 * 1000),
        refreshToken: "HfznfQUg1C2p87ESIp6WRq945ppG6swD",
        twinoidUserId: "1"
      });
      await api.token.touchTwinoidOauth({
        accessToken: "BD8AdH420AukbvExGxL5KcJNrdRMK80s",
        expirationTime: exp,
        refreshToken: "HfznfQUg1C2p87ESIp6WRq945ppG6swD",
        twinoidUserId: "1"
      });
      {
        const actual: TwinoidOauth = await api.token.getTwinoidOauth("1");
        const expected: TwinoidOauth = {
          accessToken: {
            key: "BD8AdH420AukbvExGxL5KcJNrdRMK80s",
            ctime: actual.accessToken!.ctime,
            atime: actual.accessToken!.atime,
            expirationTime: new Date(exp),
            twinoidUserId: "1",
          },
          refreshToken: {
            key: "HfznfQUg1C2p87ESIp6WRq945ppG6swD",
            ctime: actual.refreshToken!.ctime,
            atime: actual.refreshToken!.atime,
            twinoidUserId: "1",
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Touches a session to update its atime (but not ctime)", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const alice: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
      };
      await api.hammerfestStore.touchShortUser({...alice, username: "alice"});
      const session = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await timeout(1000);
      {
        const actual: StoredHammerfestSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
        const elapsed: number = actual.atime.getTime() - session.atime.getTime();
        // We use a slighltly shorer value than `1000` because `timeout` is imprecise and may sometimes last shorter (e.g. 999ms)
        chai.assert.isTrue(elapsed >= 950, `at least 1000ms elapsed: ${elapsed}`);
        const expected: StoredHammerfestSession = {
          user: alice,
          key: "aaaaaaaaaaaaaaaaaaaaaaaaaa",
          ctime: new Date(session.ctime),
          atime: new Date(actual.atime),
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Touches a Hammerfest session", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const alice: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
      };
      await api.hammerfestStore.touchShortUser({...alice, username: "alice"});
      {
        const actual: StoredHammerfestSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
        const expected: StoredHammerfestSession = {
          user: alice,
          key: "aaaaaaaaaaaaaaaaaaaaaaaaaa",
          ctime: new Date(actual.ctime),
          atime: new Date(actual.ctime),
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Touches and retrieves a Hammerfest session (without any time change)", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const alice: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
      };
      await api.hammerfestStore.touchShortUser({...alice, username: "alice"});
      const session = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await timeout(1000);
      {
        const actual: StoredHammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        const expected: StoredHammerfestSession = {
          user: alice,
          key: "aaaaaaaaaaaaaaaaaaaaaaaaaa",
          ctime: new Date(session.ctime),
          atime: new Date(session.atime),
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Returns null for an unknown Hammerfest user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const actual: StoredHammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
      chai.assert.isNull(actual);
    });
  });

  it("Returns null for a known but never authenticated Hammerfest user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const alice: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
      };
      await api.hammerfestStore.touchShortUser({...alice, username: "alice"});
      {
        const actual: StoredHammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        chai.assert.isNull(actual);
      }
    });
  });

  it("Returns null for a revoked Hammerfest session", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const alice: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
      };
      await api.hammerfestStore.touchShortUser({...alice, username: "alice"});
      await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await api.token.revokeHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa");
      {
        const actual: StoredHammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        chai.assert.isNull(actual);
      }
    });
  });

  it("Touches a session to update its atime (but not ctime)", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const alice: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
      };
      await api.hammerfestStore.touchShortUser({...alice, username: "alice"});
      const session = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await timeout(1000);
      {
        const actual: StoredHammerfestSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
        const elapsed: number = actual.atime.getTime() - session.atime.getTime();
        // We use a slighltly shorer value than `1000` because `timeout` is imprecise and may sometimes last shorter (e.g. 999ms)
        chai.assert.isTrue(elapsed >= 950, `at least 1000ms elapsed: ${elapsed}`);
        const expected: StoredHammerfestSession = {
          user: alice,
          key: "aaaaaaaaaaaaaaaaaaaaaaaaaa",
          ctime: new Date(session.ctime),
          atime: new Date(actual.atime),
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Touches, revokes, then touches again with the same session key (same user)", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const alice: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
      };
      await api.hammerfestStore.touchShortUser({...alice, username: "alice"});
      const firstSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await api.token.revokeHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa");
      await timeout(1000);
      const secondSession: StoredHammerfestSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      {
        const expected: StoredHammerfestSession = {
          user: alice,
          key: "aaaaaaaaaaaaaaaaaaaaaaaaaa",
          ctime: new Date(secondSession.ctime),
          atime: new Date(secondSession.atime),
        };
        chai.assert.deepEqual(secondSession, expected);
        const elapsed: number = secondSession.ctime.getTime() - firstSession.ctime.getTime();
        chai.assert.isTrue(elapsed >= 950, `at least 1000ms elapsed: ${elapsed}`);
      }
      {
        const actual: StoredHammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        const expected: StoredHammerfestSession = {
          user: alice,
          key: "aaaaaaaaaaaaaaaaaaaaaaaaaa",
          ctime: new Date(secondSession.ctime),
          atime: new Date(secondSession.atime),
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Touches, revokes, then touches again with the same session key (different user)", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const alice: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
      };
      await api.hammerfestStore.touchShortUser({...alice, username: "alice"});
      const bob: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "2",
      };
      await api.hammerfestStore.touchShortUser({...bob, username: "bob"});
      const firstSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await api.token.revokeHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa");
      await timeout(1000);
      const secondSession: StoredHammerfestSession = await api.token.touchHammerfest(bob.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", bob.id);
      {
        const expected: StoredHammerfestSession = {
          user: bob,
          key: "aaaaaaaaaaaaaaaaaaaaaaaaaa",
          ctime: new Date(secondSession.ctime),
          atime: new Date(secondSession.atime),
        };
        chai.assert.deepEqual(secondSession, expected);
        const elapsed: number = secondSession.ctime.getTime() - firstSession.ctime.getTime();
        chai.assert.isTrue(elapsed >= 950, `at least 1000ms elapsed: ${elapsed}`);
      }
      {
        const actual: StoredHammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        chai.assert.isNull(actual);
      }
      {
        const actual: StoredHammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "2");
        const expected: StoredHammerfestSession = {
          user: bob,
          key: "aaaaaaaaaaaaaaaaaaaaaaaaaa",
          ctime: new Date(secondSession.ctime),
          atime: new Date(secondSession.atime),
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Touches without a different user without revoking first", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const alice: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
      };
      await api.hammerfestStore.touchShortUser({...alice, username: "alice"});
      const bob: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "2",
      };
      await api.hammerfestStore.touchShortUser({...bob, username: "bob"});
      const firstSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await timeout(1000);
      const secondSession: StoredHammerfestSession = await api.token.touchHammerfest(bob.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", bob.id);
      {
        const expected: StoredHammerfestSession = {
          user: bob,
          key: "aaaaaaaaaaaaaaaaaaaaaaaaaa",
          ctime: new Date(secondSession.ctime),
          atime: new Date(secondSession.atime),
        };
        chai.assert.deepEqual(secondSession, expected);
        const elapsed: number = secondSession.ctime.getTime() - firstSession.ctime.getTime();
        chai.assert.isTrue(elapsed >= 950, `at least 1000ms elapsed: ${elapsed}`);
      }
      {
        const actual: StoredHammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        chai.assert.isNull(actual);
      }
      {
        const actual: StoredHammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "2");
        const expected: StoredHammerfestSession = {
          user: bob,
          key: "aaaaaaaaaaaaaaaaaaaaaaaaaa",
          ctime: new Date(secondSession.ctime),
          atime: new Date(secondSession.atime),
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Touches with a new session key without revoking first", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const alice: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
      };
      await api.hammerfestStore.touchShortUser({...alice, username: "alice"});
      const firstSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await timeout(1000);
      const secondSession: StoredHammerfestSession = await api.token.touchHammerfest(alice.server, "bbbbbbbbbbbbbbbbbbbbbbbbbb", alice.id);
      {
        const expected: StoredHammerfestSession = {
          user: alice,
          key: "bbbbbbbbbbbbbbbbbbbbbbbbbb",
          ctime: new Date(secondSession.ctime),
          atime: new Date(secondSession.atime),
        };
        chai.assert.deepEqual(secondSession, expected);
        const elapsed: number = secondSession.ctime.getTime() - firstSession.ctime.getTime();
        chai.assert.isTrue(elapsed >= 950, `at least 1000ms elapsed: ${elapsed}`);
      }
      {
        const actual: StoredHammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        const expected: StoredHammerfestSession = {
          user: alice,
          key: "bbbbbbbbbbbbbbbbbbbbbbbbbb",
          ctime: new Date(secondSession.ctime),
          atime: new Date(secondSession.atime),
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Touching automatically revokes a previous key with a different user and a same user token with a different key", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: TestApi): Promise<void> => {
      const alice: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
      };
      await api.hammerfestStore.touchShortUser({...alice, username: "alice"});
      const bob: HammerfestUserIdRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "2",
      };
      await api.hammerfestStore.touchShortUser({...bob, username: "bob"});
      const firstSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      const secondSession: StoredHammerfestSession = await api.token.touchHammerfest(bob.server, "bbbbbbbbbbbbbbbbbbbbbbbbbb", bob.id);
      await timeout(1000);
      const thirdSession: StoredHammerfestSession = await api.token.touchHammerfest(alice.server, "bbbbbbbbbbbbbbbbbbbbbbbbbb", alice.id);
      {
        const expected: StoredHammerfestSession = {
          user: alice,
          key: "bbbbbbbbbbbbbbbbbbbbbbbbbb",
          ctime: new Date(thirdSession.ctime),
          atime: new Date(thirdSession.atime),
        };
        chai.assert.deepEqual(thirdSession, expected);
        {
          const elapsed: number = thirdSession.ctime.getTime() - firstSession.ctime.getTime();
          chai.assert.isTrue(elapsed >= 950, `at least 1000ms elapsed (from first): ${elapsed}`);
        }
        {
          const elapsed: number = thirdSession.ctime.getTime() - secondSession.ctime.getTime();
          chai.assert.isTrue(elapsed >= 950, `at least 1000ms elapsed (from second): ${elapsed}`);
        }
      }
      {
        const actual: StoredHammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        const expected: StoredHammerfestSession = {
          user: alice,
          key: "bbbbbbbbbbbbbbbbbbbbbbbbbb",
          ctime: new Date(thirdSession.ctime),
          atime: new Date(thirdSession.atime),
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: StoredHammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "2");
        chai.assert.isNull(actual);
      }
    });
  });
}

async function timeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
