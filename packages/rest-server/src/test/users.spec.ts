import { $AuthContext, AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { $UserCredentials } from "@eternal-twin/core/lib/auth/user-credentials.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { $HammerfestUserIdRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id-ref.js";
import { $VersionedHammerfestLink } from "@eternal-twin/core/lib/link/versioned-hammerfest-link.js";
import { $CompleteUser, CompleteUser } from "@eternal-twin/core/lib/user/complete-user.js";
import { LinkToHammerfestMethod } from "@eternal-twin/core/lib/user/link-to-hammerfest-method.js";
import { $LinkToHammerfestWithCredentialsOptions } from "@eternal-twin/core/lib/user/link-to-hammerfest-with-credentials-options.js";
import { $SimpleUser, SimpleUser } from "@eternal-twin/core/lib/user/simple-user.js";
import { $UpdateUserPatch } from "@eternal-twin/core/lib/user/update-user-patch.js";
import { $User, User } from "@eternal-twin/core/lib/user/user.js";
import chai from "chai";
import chaiHttp from "chai-http";
import { $Null } from "kryo/lib/null.js";

import { populateUsers } from "./populate/users.js";
import { TestAgent } from "./test-agent.js";
import { withTestServer } from "./test-server.js";

chai.use(chaiHttp);

describe("/users", () => {
  it("should create two users and retrieve them", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(false, async ({server}) => {
      const guestAgent: TestAgent = new TestAgent(chai.request.agent(server));
      const {alice, aliceAgent, bob, bobAgent} = await populateUsers(server);
      {
        const actual: CompleteUser = await aliceAgent.get(`/users/${alice.id}`, $CompleteUser);
        const expected: CompleteUser = {
          type: ObjectType.User,
          id: alice.id,
          createdAt: alice.createdAt,
          displayName: {
            current: {
              // start: {
              //   time: alice.createdAt,
              //   user: {
              //     type: ObjectType.User,
              //     id: alice.id,
              //     displayName: {current: {value: "Alice"}},
              //   }
              // },
              // end: null,
              value: "Alice",
            },
            // old: [],
          },
          isAdministrator: true,
          username: "alice",
          emailAddress: null,
          hasPassword: true,
          links: {
            dinoparcCom: {
              current: null,
              old: [],
            },
            enDinoparcCom: {
              current: null,
              old: [],
            },
            hammerfestEs: {
              current: null,
              old: [],
            },
            hammerfestFr: {
              current: null,
              old: [],
            },
            hfestNet: {
              current: null,
              old: [],
            },
            spDinoparcCom: {
              current: null,
              old: [],
            },
            twinoid: {
              current: null,
              old: [],
            },
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: User = await bobAgent.get(`/users/${alice.id}`, $User);
        const expected: User = {
          type: ObjectType.User,
          id: alice.id,
          createdAt: alice.createdAt,
          displayName: {
            current: {
              // start: {
              //   time: alice.createdAt,
              //   user: {
              //     type: ObjectType.User,
              //     id: alice.id,
              //     displayName: {current: {value: "Alice"}},
              //   }
              // },
              // end: null,
              value: "Alice",
            },
            // old: [],
          },
          isAdministrator: true,
          links: {
            dinoparcCom: {
              current: null,
              old: [],
            },
            enDinoparcCom: {
              current: null,
              old: [],
            },
            hammerfestEs: {
              current: null,
              old: [],
            },
            hammerfestFr: {
              current: null,
              old: [],
            },
            hfestNet: {
              current: null,
              old: [],
            },
            spDinoparcCom: {
              current: null,
              old: [],
            },
            twinoid: {
              current: null,
              old: [],
            },
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: User = await guestAgent.get(`/users/${alice.id}`, $User);
        const expected: User = {
          type: ObjectType.User,
          id: alice.id,
          createdAt: alice.createdAt,
          displayName: {
            current: {
              // start: {
              //   time: alice.createdAt,
              //   user: {
              //     type: ObjectType.User,
              //     id: alice.id,
              //     displayName: {current: {value: "Alice"}},
              //   }
              // },
              // end: null,
              value: "Alice",
            },
            // old: [],
          },
          isAdministrator: true,
          links: {
            dinoparcCom: {
              current: null,
              old: [],
            },
            enDinoparcCom: {
              current: null,
              old: [],
            },
            hammerfestEs: {
              current: null,
              old: [],
            },
            hammerfestFr: {
              current: null,
              old: [],
            },
            hfestNet: {
              current: null,
              old: [],
            },
            spDinoparcCom: {
              current: null,
              old: [],
            },
            twinoid: {
              current: null,
              old: [],
            },
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: CompleteUser = await aliceAgent.get(`/users/${bob.id}`, $CompleteUser);
        const expected: CompleteUser = {
          type: ObjectType.User,
          id: bob.id,
          createdAt: bob.createdAt,
          displayName: {
            current: {
              // start: {
              //   time: bob.createdAt,
              //   user: {
              //     type: ObjectType.User,
              //     id: bob.id,
              //     displayName: {current: {value: "Bob"}},
              //   }
              // },
              // end: null,
              value: "Bob",
            },
            // old: [],
          },
          isAdministrator: false,
          username: "bob",
          emailAddress: null,
          hasPassword: true,
          links: {
            dinoparcCom: {
              current: null,
              old: [],
            },
            enDinoparcCom: {
              current: null,
              old: [],
            },
            hammerfestEs: {
              current: null,
              old: [],
            },
            hammerfestFr: {
              current: null,
              old: [],
            },
            hfestNet: {
              current: null,
              old: [],
            },
            spDinoparcCom: {
              current: null,
              old: [],
            },
            twinoid: {
              current: null,
              old: [],
            },
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: CompleteUser = await bobAgent.get(`/users/${bob.id}`, $CompleteUser);
        const expected: CompleteUser = {
          type: ObjectType.User,
          id: bob.id,
          createdAt: bob.createdAt,
          displayName: {
            current: {
              // start: {
              //   time: bob.createdAt,
              //   user: {
              //     type: ObjectType.User,
              //     id: bob.id,
              //     displayName: {current: {value: "Bob"}},
              //   }
              // },
              // end: null,
              value: "Bob",
            },
            // old: [],
          },
          isAdministrator: false,
          username: "bob",
          emailAddress: null,
          hasPassword: true,
          links: {
            dinoparcCom: {
              current: null,
              old: [],
            },
            enDinoparcCom: {
              current: null,
              old: [],
            },
            hammerfestEs: {
              current: null,
              old: [],
            },
            hammerfestFr: {
              current: null,
              old: [],
            },
            hfestNet: {
              current: null,
              old: [],
            },
            spDinoparcCom: {
              current: null,
              old: [],
            },
            twinoid: {
              current: null,
              old: [],
            },
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: User = await guestAgent.get(`/users/${bob.id}`, $User);
        const expected: User = {
          type: ObjectType.User,
          id: bob.id,
          createdAt: bob.createdAt,
          displayName: {
            current: {
              // start: {
              //   time: bob.createdAt,
              //   user: {
              //     type: ObjectType.User,
              //     id: bob.id,
              //     displayName: {current: {value: "Bob"}},
              //   }
              // },
              // end: null,
              value: "Bob",
            },
            // old: [],
          },
          isAdministrator: false,
          links: {
            dinoparcCom: {
              current: null,
              old: [],
            },
            enDinoparcCom: {
              current: null,
              old: [],
            },
            hammerfestEs: {
              current: null,
              old: [],
            },
            hammerfestFr: {
              current: null,
              old: [],
            },
            hfestNet: {
              current: null,
              old: [],
            },
            spDinoparcCom: {
              current: null,
              old: [],
            },
            twinoid: {
              current: null,
              old: [],
            },
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("should update a user's display name", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(true, async ({server}) => {
      const guestAgent: TestAgent = new TestAgent(chai.request.agent(server));
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-01T00:00:00.000Z")});
      const {alice, aliceAgent} = await populateUsers(server);
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-31T00:00:00.000Z")});
      {
        const actual: User = await aliceAgent.patch(`/users/${alice.id}`, $UpdateUserPatch, {displayName: "Allison"}, $User);
        const expected: User = {
          type: ObjectType.User,
          id: alice.id,
          createdAt: new Date("2021-01-01T00:00:00.000Z"),
          displayName: {
            current: {
              value: "Allison",
            },
          },
          isAdministrator: true,
          links: {
            dinoparcCom: {
              current: null,
              old: [],
            },
            enDinoparcCom: {
              current: null,
              old: [],
            },
            hammerfestEs: {
              current: null,
              old: [],
            },
            hammerfestFr: {
              current: null,
              old: [],
            },
            hfestNet: {
              current: null,
              old: [],
            },
            spDinoparcCom: {
              current: null,
              old: [],
            },
            twinoid: {
              current: null,
              old: [],
            },
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("should update users to swap usernames", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(true, async ({server}) => {
      const guestAgent: TestAgent = new TestAgent(chai.request.agent(server));
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-01T00:00:00.000Z")});
      const {alice, aliceAgent, bob, bobAgent} = await populateUsers(server);
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-11T00:00:00.000Z")});
      await aliceAgent.patch(`/users/${alice.id}`, $UpdateUserPatch, {username: null}, $User);
      await bobAgent.patch(`/users/${bob.id}`, $UpdateUserPatch, {username: "alice"}, $User);
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-21T00:00:00.000Z")});
      await aliceAgent.patch(`/users/${alice.id}`, $UpdateUserPatch, {username: "bob"}, $User);
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-22T00:00:00.000Z")});
      {
        const actual: AuthContext = await aliceAgent.delete("/auth/self", $Null, null, $AuthContext);
        const expected: AuthContext = {
          type: AuthType.Guest,
          scope: AuthScope.Default,
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: AuthContext = await bobAgent.delete("/auth/self", $Null, null, $AuthContext);
        const expected: AuthContext = {
          type: AuthType.Guest,
          scope: AuthScope.Default,
        };
        chai.assert.deepEqual(actual, expected);
      }
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-23T00:00:00.000Z")});
      {
        const actual: SimpleUser = await aliceAgent.put(
          "/auth/self?method=Etwin",
          $UserCredentials,
          {
            login: "alice",
            password: Buffer.from("bbbbbbbbbb"),
          },
          $SimpleUser,
        );
        const expected: SimpleUser = {
          type: ObjectType.User,
          id: bob.id,
          createdAt: new Date("2021-01-01T00:00:00.000Z"),
          displayName: {
            current: {
              value: "Bob"
            },
          },
          isAdministrator: false,
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: SimpleUser = await bobAgent.put(
          "/auth/self?method=Etwin",
          $UserCredentials,
          {
            login: "bob",
            password: Buffer.from("aaaaaaaaaa"),
          },
          $SimpleUser,
        );
        const expected: SimpleUser = {
          type: ObjectType.User,
          id: alice.id,
          createdAt: new Date("2021-01-01T00:00:00.000Z"),
          displayName: {
            current: {
              value: "Alice"
            },
          },
          isAdministrator: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("should update a user's password", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(true, async ({server}) => {
      const guestAgent: TestAgent = new TestAgent(chai.request.agent(server));
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-01T00:00:00.000Z")});
      const {bob, bobAgent} = await populateUsers(server);
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-01T00:10:00.000Z")});
      await bobAgent.patch(`/users/${bob.id}`, $UpdateUserPatch, {password: Buffer.from("aaaaaaaaaa")}, $User);
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-01T00:20:00.000Z")});
      {
        const actual: AuthContext = await bobAgent.delete("/auth/self", $Null, null, $AuthContext);
        const expected: AuthContext = {
          type: AuthType.Guest,
          scope: AuthScope.Default,
        };
        chai.assert.deepEqual(actual, expected);
      }
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-01T00:30:00.000Z")});
      {
        const actual: SimpleUser = await bobAgent.put(
          "/auth/self?method=Etwin",
          $UserCredentials,
          {
            login: "bob",
            password: Buffer.from("aaaaaaaaaa"),
          },
          $SimpleUser,
        );
        const expected: SimpleUser = {
          type: ObjectType.User,
          id: bob.id,
          createdAt: new Date("2021-01-01T00:00:00.000Z"),
          displayName: {
            current: {
              value: "Bob"
            },
          },
          isAdministrator: false,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });


  it("should update users to swap linked Hammerfest users", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(true, async ({hammerfestClient, server}) => {
      await hammerfestClient.createUser("hammerfest.fr", "234", "alicehf", "aaaaa");
      await hammerfestClient.createUser("hammerfest.fr", "345", "bobhf", "bbbbb");

      const guestAgent: TestAgent = new TestAgent(chai.request.agent(server));
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-01T00:00:00.000Z")});
      const {alice, aliceAgent, bob, bobAgent} = await populateUsers(server);
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-01T00:00:01.000Z")});
      await aliceAgent.put(
        `/users/${alice.id}/links/hammerfest.fr`,
        $LinkToHammerfestWithCredentialsOptions,
        {
          method: LinkToHammerfestMethod.Credentials,
          userId: alice.id,
          hammerfestServer: "hammerfest.fr",
          hammerfestUsername: "alicehf",
          hammerfestPassword: "aaaaa",
        },
        $VersionedHammerfestLink,
      );
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-01T00:00:02.000Z")});
      await bobAgent.put(
        `/users/${bob.id}/links/hammerfest.fr`,
        $LinkToHammerfestWithCredentialsOptions,
        {
          method: LinkToHammerfestMethod.Credentials,
          userId: bob.id,
          hammerfestServer: "hammerfest.fr",
          hammerfestUsername: "bobhf",
          hammerfestPassword: "bbbbb",
        },
        $VersionedHammerfestLink,
      );
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-01T00:00:03.000Z")});
      await aliceAgent.delete(
        `/users/${alice.id}/links/hammerfest.fr`,
        $HammerfestUserIdRef,
        {
          type: ObjectType.HammerfestUser,
          server: "hammerfest.fr",
          id: "234",
        },
        $VersionedHammerfestLink,
      );
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-01T00:00:04.000Z")});
      await bobAgent.delete(
        `/users/${bob.id}/links/hammerfest.fr`,
        $HammerfestUserIdRef,
        {
          type: ObjectType.HammerfestUser,
          server: "hammerfest.fr",
          id: "345",
        },
        $VersionedHammerfestLink,
      );
      await guestAgent.rawPut("/clock", {time: new Date("2021-01-01T00:00:05.000Z")});
      await aliceAgent.put(
        `/users/${alice.id}/links/hammerfest.fr`,
        $LinkToHammerfestWithCredentialsOptions,
        {
          method: LinkToHammerfestMethod.Credentials,
          userId: alice.id,
          hammerfestServer: "hammerfest.fr",
          hammerfestUsername: "bobhf",
          hammerfestPassword: "bbbbb",
        },
        $VersionedHammerfestLink,
      );
      {
        const actual: CompleteUser = await aliceAgent.get(`/users/${alice.id}`, $CompleteUser);
        const expected: CompleteUser = {
          type: ObjectType.User,
          id: alice.id,
          createdAt: new Date("2021-01-01T00:00:00.000Z"),
          displayName: {
            current: {
              value: "Alice",
            },
          },
          isAdministrator: true,
          username: "alice",
          emailAddress: null,
          hasPassword: true,
          links: {
            dinoparcCom: {
              current: null,
              old: [],
            },
            enDinoparcCom: {
              current: null,
              old: [],
            },
            hammerfestEs: {
              current: null,
              old: [],
            },
            hammerfestFr: {
              current: {
                link: {
                  time: new Date("2021-01-01T00:00:05.000Z"),
                  user: {
                    type: ObjectType.User,
                    id: alice.id,
                    displayName: {
                      current: {
                        value: "Alice",
                      },
                    },
                  },
                },
                unlink: null,
                user: {
                  type: ObjectType.HammerfestUser,
                  server: "hammerfest.fr",
                  id: "345",
                  username: "bobhf",
                },
              },
              old: [],
            },
            hfestNet: {
              current: null,
              old: [],
            },
            spDinoparcCom: {
              current: null,
              old: [],
            },
            twinoid: {
              current: null,
              old: [],
            },
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
});
