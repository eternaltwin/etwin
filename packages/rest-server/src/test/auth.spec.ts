import { $AuthContext, AuthContext } from "@eternal-twin/core/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { $RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options.js";
import { $UserCredentials } from "@eternal-twin/core/lib/auth/user-credentials.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ShortUser } from "@eternal-twin/core/lib/user/short-user.js";
import { $SimpleUser, SimpleUser } from "@eternal-twin/core/lib/user/simple-user.js";
import chai from "chai";
import chaiHttp from "chai-http";

import { TestAgent } from "./test-agent.js";
import { withTestServer } from "./test-server.js";

chai.use(chaiHttp);

describe("/auth", () => {
  it("should return a guest auth context when unauthenticated", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(async ({server}) => {
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
    return withTestServer(async ({server}) => {
      const agent: TestAgent = new TestAgent(chai.request.agent(server));
      const actualUser: ShortUser = await agent.post(
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
          displayName: {current: {value: "Alice"}},
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
    return withTestServer(async ({server}) => {
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
          displayName: {current: {value: "Alice"}},
          isAdministrator: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("should register a user and sign out", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(async ({server}) => {
      const agent: TestAgent = new TestAgent(chai.request.agent(server));
      const actualUser: ShortUser = await agent.post(
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
          displayName: {current: {value: "Alice"}},
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
        const actual: AuthContext = await agent.delete("/auth/self", $AuthContext);
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
});
