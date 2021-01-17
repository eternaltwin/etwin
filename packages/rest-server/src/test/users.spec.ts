import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { $CompleteUser, CompleteUser } from "@eternal-twin/core/lib/user/complete-user.js";
import { $User, User } from "@eternal-twin/core/lib/user/user.js";
import chai from "chai";
import chaiHttp from "chai-http";

import { populateUsers } from "./populate/users.js";
import { TestAgent } from "./test-agent.js";
import { withTestServer } from "./test-server.js";

chai.use(chaiHttp);

describe("/users", () => {
  it("should create two users and retrieve them", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(async ({server}) => {
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
});
