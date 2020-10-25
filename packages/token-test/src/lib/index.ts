import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { ShortHammerfestUser } from "@eternal-twin/core/lib/hammerfest/short-hammerfest-user.js";
import { TokenService } from "@eternal-twin/core/lib/token/service.js";
import chai from "chai";

export interface Api {
  hammerfestArchive: HammerfestArchiveService;
  token: TokenService;
}

export function testTokenService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Touches a Hammerfest session", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const alice: ShortHammerfestUser = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.touchShortUser(alice);
      {
        const actual: HammerfestSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
        const expected: HammerfestSession = {
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
    return withApi(async (api: Api): Promise<void> => {
      const alice: ShortHammerfestUser = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.touchShortUser(alice);
      const session = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await timeout(1000);
      {
        const actual: HammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        const expected: HammerfestSession = {
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
    return withApi(async (api: Api): Promise<void> => {
      const actual: HammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
      chai.assert.isNull(actual);
    });
  });

  it("Returns null for a known but never authenticated Hammerfest user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const alice: ShortHammerfestUser = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.touchShortUser(alice);
      {
        const actual: HammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        chai.assert.isNull(actual);
      }
    });
  });

  it("Returns null for a revoked Hammerfest session", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const alice: ShortHammerfestUser = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.touchShortUser(alice);
      await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await api.token.revokeHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa");
      {
        const actual: HammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        chai.assert.isNull(actual);
      }
    });
  });

  it("Touches a session to update its atime (but not ctime)", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const alice: ShortHammerfestUser = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.touchShortUser(alice);
      const session = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await timeout(1000);
      {
        const actual: HammerfestSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
        const elapsed: number = actual.atime.getTime() - session.atime.getTime();
        // We use a slighltly shorer value than `1000` because `timeout` is imprecise and may sometimes last shorter (e.g. 999ms)
        chai.assert.isTrue(elapsed >= 950, `at least 1000ms elapsed: ${elapsed}`);
        const expected: HammerfestSession = {
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
    return withApi(async (api: Api): Promise<void> => {
      const alice: ShortHammerfestUser = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.touchShortUser(alice);
      const firstSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await api.token.revokeHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa");
      await timeout(1000);
      const secondSession: HammerfestSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      {
        const expected: HammerfestSession = {
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
        const actual: HammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        const expected: HammerfestSession = {
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
    return withApi(async (api: Api): Promise<void> => {
      const alice: ShortHammerfestUser = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.touchShortUser(alice);
      const bob: ShortHammerfestUser = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "2",
        username: "bob",
      };
      await api.hammerfestArchive.touchShortUser(bob);
      const firstSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await api.token.revokeHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa");
      await timeout(1000);
      const secondSession: HammerfestSession = await api.token.touchHammerfest(bob.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", bob.id);
      {
        const expected: HammerfestSession = {
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
        const actual: HammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        chai.assert.isNull(actual);
      }
      {
        const actual: HammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "2");
        const expected: HammerfestSession = {
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
    return withApi(async (api: Api): Promise<void> => {
      const alice: ShortHammerfestUser = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.touchShortUser(alice);
      const bob: ShortHammerfestUser = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "2",
        username: "bob",
      };
      await api.hammerfestArchive.touchShortUser(bob);
      const firstSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await timeout(1000);
      const secondSession: HammerfestSession = await api.token.touchHammerfest(bob.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", bob.id);
      {
        const expected: HammerfestSession = {
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
        const actual: HammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        chai.assert.isNull(actual);
      }
      {
        const actual: HammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "2");
        const expected: HammerfestSession = {
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
    return withApi(async (api: Api): Promise<void> => {
      const alice: ShortHammerfestUser = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.touchShortUser(alice);
      const firstSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await timeout(1000);
      const secondSession: HammerfestSession = await api.token.touchHammerfest(alice.server, "bbbbbbbbbbbbbbbbbbbbbbbbbb", alice.id);
      {
        const expected: HammerfestSession = {
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
        const actual: HammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        const expected: HammerfestSession = {
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
    return withApi(async (api: Api): Promise<void> => {
      const alice: ShortHammerfestUser = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.touchShortUser(alice);
      const bob: ShortHammerfestUser = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "2",
        username: "bob",
      };
      await api.hammerfestArchive.touchShortUser(bob);
      const firstSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      const secondSession: HammerfestSession = await api.token.touchHammerfest(bob.server, "bbbbbbbbbbbbbbbbbbbbbbbbbb", bob.id);
      await timeout(1000);
      const thirdSession: HammerfestSession = await api.token.touchHammerfest(alice.server, "bbbbbbbbbbbbbbbbbbbbbbbbbb", alice.id);
      {
        const expected: HammerfestSession = {
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
        const actual: HammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        const expected: HammerfestSession = {
          user: alice,
          key: "bbbbbbbbbbbbbbbbbbbbbbbbbb",
          ctime: new Date(thirdSession.ctime),
          atime: new Date(thirdSession.atime),
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: HammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "2");
        chai.assert.isNull(actual);
      }
    });
  });
}

async function timeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
