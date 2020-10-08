import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { SystemAuthContext } from "@eternal-twin/core/lib/auth/system-auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import { HammerfestUserRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-ref.js";
import { TokenService } from "@eternal-twin/core/lib/token/service.js";
import chai from "chai";

export interface Api {
  hammerfestArchive: HammerfestArchiveService;
  token: TokenService;
}

const SYSTEM_AUTH: SystemAuthContext = {type: AuthType.System, scope: AuthScope.Default};

export function testTokenService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Touches a Hammerfest session", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const alice: HammerfestUserRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.createOrUpdateUserRef(SYSTEM_AUTH, alice);
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
      const alice: HammerfestUserRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.createOrUpdateUserRef(SYSTEM_AUTH, alice);
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
      const alice: HammerfestUserRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.createOrUpdateUserRef(SYSTEM_AUTH, alice);
      {
        const actual: HammerfestSession | null = await api.token.getHammerfest("hammerfest.fr", "1");
        chai.assert.isNull(actual);
      }
    });
  });

  it("Returns null for a revoked Hammerfest session", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const alice: HammerfestUserRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.createOrUpdateUserRef(SYSTEM_AUTH, alice);
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
      const alice: HammerfestUserRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.createOrUpdateUserRef(SYSTEM_AUTH, alice);
      const session = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
      await timeout(1000);
      {
        const actual: HammerfestSession = await api.token.touchHammerfest(alice.server, "aaaaaaaaaaaaaaaaaaaaaaaaaa", alice.id);
        const elapsed: number = actual.atime.getTime() - session.atime.getTime();
        chai.assert.isTrue(elapsed >= 1000);
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
      const alice: HammerfestUserRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.createOrUpdateUserRef(SYSTEM_AUTH, alice);
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
        chai.assert.isTrue(elapsed >= 1000);
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
      const alice: HammerfestUserRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.createOrUpdateUserRef(SYSTEM_AUTH, alice);
      const bob: HammerfestUserRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "2",
        username: "bob",
      };
      await api.hammerfestArchive.createOrUpdateUserRef(SYSTEM_AUTH, bob);
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
        chai.assert.isTrue(elapsed >= 1000);
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
      const alice: HammerfestUserRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "1",
        username: "alice",
      };
      await api.hammerfestArchive.createOrUpdateUserRef(SYSTEM_AUTH, alice);
      const bob: HammerfestUserRef = {
        type: ObjectType.HammerfestUser,
        server: "hammerfest.fr",
        id: "2",
        username: "bob",
      };
      await api.hammerfestArchive.createOrUpdateUserRef(SYSTEM_AUTH, bob);
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
        chai.assert.isTrue(elapsed >= 1000);
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
}

async function timeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
