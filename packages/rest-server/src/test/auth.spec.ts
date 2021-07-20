import { $AuthContext, AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type";
import { $RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options";
import { $UserCredentials } from "@eternal-twin/core/lib/auth/user-credentials";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type";
import { $SimpleUser, SimpleUser } from "@eternal-twin/core/lib/user/simple-user";
import chai from "chai";
import chaiHttp from "chai-http";
import { $Null } from "kryo/null";

import { TestAgent } from "./test-agent.js";
import { withTestServer } from "./test-server.js";

chai.use(chaiHttp);

describe("/auth", () => {
  it("should return a guest auth context when unauthenticated", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(false, async ({server}) => {
      const agent: TestAgent = new TestAgent(chai.request.agent(server));
      {
        const actual: AuthContext = await agent.get("/auth/self", $AuthContext);
        const expected: AuthContext = {
          type: AuthType.Guest,
          scope: AuthScope.Default,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("should register a user and retrieve the automatic auth", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(false, async ({server}) => {
      const agent: TestAgent = new TestAgent(chai.request.agent(server));
      const actualUser: SimpleUser = await agent.post(
        "/users",
        $RegisterWithUsernameOptions,
        {
          username: "alice",
          displayName: "Alice",
          password: Buffer.from("aaaaa"),
        },
        $SimpleUser,
      );
      {
        const expected: SimpleUser = {
          type: ObjectType.User,
          id: actualUser.id,
          createdAt: actualUser.createdAt,
          displayName: {
            current: {
              // start: {
              //   time: actualUser.createdAt,
              //   user: {
              //     type: ObjectType.User,
              //     id: actualUser.id,
              //     displayName: {
              //       current: {value: "Alice"},
              //     },
              //   }
              // },
              // end: null,
              value: "Alice"
            },
            // old: []
          },
          isAdministrator: true,
        };
        chai.assert.deepEqual(actualUser, expected);
      }
      {
        const actual: AuthContext = await agent.get("/auth/self", $AuthContext);
        const expected: AuthContext = {
          type: AuthType.User,
          scope: AuthScope.Default,
          user: {
            type: ObjectType.User,
            id: actualUser.id,
            displayName: {current: {value: "Alice"}},
          },
          isAdministrator: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("should register a user and authenticate back", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(false, async ({server}) => {
      let user: SimpleUser;
      {
        const agent: TestAgent = new TestAgent(chai.request.agent(server));
        user = await agent.post(
          "/users",
          $RegisterWithUsernameOptions,
          {
            username: "alice",
            displayName: "Alice",
            password: Buffer.from("aaaaa"),
          },
          $SimpleUser,
        );
      }
      const agent: TestAgent = new TestAgent(chai.request.agent(server));
      {
        const actual: AuthContext = await agent.get("/auth/self", $AuthContext);
        const expected: AuthContext = {
          type: AuthType.Guest,
          scope: AuthScope.Default,
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: SimpleUser = await agent.put(
          "/auth/self?method=Etwin",
          $UserCredentials,
          {
            login: "alice",
            password: Buffer.from("aaaaa"),
          },
          $SimpleUser,
        );
        const expected: SimpleUser = {
          type: ObjectType.User,
          id: user.id,
          createdAt: user.createdAt,
          displayName: {
            current: {
              // start: {
              //   time: user.createdAt,
              //   user: {
              //     type: ObjectType.User,
              //     id: user.id,
              //     displayName: {
              //       current: {value: "Alice"},
              //     },
              //   }
              // },
              // end: null,
              value: "Alice"
            },
            // old: []
          },
          isAdministrator: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("should register a user and sign out", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(false, async ({server}) => {
      const agent: TestAgent = new TestAgent(chai.request.agent(server));
      const actualUser: SimpleUser = await agent.post(
        "/users",
        $RegisterWithUsernameOptions,
        {
          username: "alice",
          displayName: "Alice",
          password: Buffer.from("aaaaa"),
        },
        $SimpleUser,
      );
      {
        const expected: SimpleUser = {
          type: ObjectType.User,
          id: actualUser.id,
          createdAt: actualUser.createdAt,
          displayName: {
            current: {
              // start: {
              //   time: actualUser.createdAt,
              //   user: {
              //     type: ObjectType.User,
              //     id: actualUser.id,
              //     displayName: {
              //       current: {value: "Alice"},
              //     },
              //   }
              // },
              // end: null,
              value: "Alice"
            },
            // old: []
          },
          isAdministrator: true,
        };
        chai.assert.deepEqual(actualUser, expected);
      }
      {
        const actual: AuthContext = await agent.get("/auth/self", $AuthContext);
        const expected: AuthContext = {
          type: AuthType.User,
          scope: AuthScope.Default,
          user: {
            type: ObjectType.User,
            id: actualUser.id,
            displayName: {current: {value: "Alice"}},
          },
          isAdministrator: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: AuthContext = await agent.delete("/auth/self", $Null, null, $AuthContext);
        const expected: AuthContext = {
          type: AuthType.Guest,
          scope: AuthScope.Default,
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: AuthContext = await agent.get("/auth/self", $AuthContext);
        const expected: AuthContext = {
          type: AuthType.Guest,
          scope: AuthScope.Default,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("should register a regular user and authenticate with a session", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(false, async ({server}) => {
      const aliceAgent: TestAgent = new TestAgent(chai.request.agent(server));
      await aliceAgent.post(
        "/users",
        $RegisterWithUsernameOptions,
        {
          username: "alice",
          displayName: "Alice",
          password: Buffer.from("aaaaaaaaaa"),
        },
        $SimpleUser,
      );
      const bobAgent: TestAgent = new TestAgent(chai.request.agent(server));
      const bobUser: SimpleUser = await bobAgent.post(
        "/users",
        $RegisterWithUsernameOptions,
        {
          username: "bob",
          displayName: "Bob",
          password: Buffer.from("bbbbbbbbbb"),
        },
        $SimpleUser,
      );
      {
        const actual: AuthContext = await bobAgent.get("/auth/self", $AuthContext);
        const expected: AuthContext = {
          type: AuthType.User,
          scope: AuthScope.Default,
          user: {
            type: ObjectType.User,
            id: bobUser.id,
            displayName: {current: {value: "Bob"}},
          },
          isAdministrator: false,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
});
