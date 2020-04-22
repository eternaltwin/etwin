import { $AuthContext, AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/etwin-api-types/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type.js";
import { $Credentials } from "@eternal-twin/etwin-api-types/lib/auth/credentials.js";
import { $RegisterWithUsernameOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-with-username-options.js";
import { ObjectType } from "@eternal-twin/etwin-api-types/lib/core/object-type.js";
import { UserRef } from "@eternal-twin/etwin-api-types/lib/user/user-ref.js";
import { $User, User } from "@eternal-twin/etwin-api-types/lib/user/user.js";
import chai from "chai";
import chaiHttp from "chai-http";

import { TestAgent } from "./test-agent.js";
import { withTestServer } from "./test-server.js";

chai.use(chaiHttp);

describe("/auth", () => {
  it("should return a guest auth context when unauthenticated", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(async server => {
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
    return withTestServer(async server => {
      const agent: TestAgent = new TestAgent(chai.request.agent(server));
      const actualUser: UserRef = await agent.post(
        "/users",
        $RegisterWithUsernameOptions,
        {
          username: "alice",
          displayName: "Alice",
          password: Buffer.from("aaaaa"),
        },
        $User,
      );
      {
        const expected: User = {
          type: ObjectType.User,
          id: actualUser.id,
          displayName: "Alice",
          isAdministrator: true,
        };
        chai.assert.deepEqual(actualUser, expected);
      }
      {
        const actual: AuthContext = await agent.get("/auth/self", $AuthContext);
        const expected: AuthContext = {
          type: AuthType.User,
          scope: AuthScope.Default,
          userId: actualUser.id,
          displayName: "Alice",
          isAdministrator: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("should register a user and authenticate back", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(async server => {
      let user: User;
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
          $User,
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
        const actual: User = await agent.put(
          "/auth/self?method=Etwin",
          $Credentials,
          {
            login: "alice",
            password: Buffer.from("aaaaa"),
          },
          $User,
        );
        const expected: User = {
          type: ObjectType.User,
          id: user.id,
          displayName: "Alice",
          isAdministrator: true,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("should register a user and sign out", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(async server => {
      const agent: TestAgent = new TestAgent(chai.request.agent(server));
      const actualUser: UserRef = await agent.post(
        "/users",
        $RegisterWithUsernameOptions,
        {
          username: "alice",
          displayName: "Alice",
          password: Buffer.from("aaaaa"),
        },
        $User,
      );
      {
        const expected: User = {
          type: ObjectType.User,
          id: actualUser.id,
          displayName: "Alice",
          isAdministrator: true,
        };
        chai.assert.deepEqual(actualUser, expected);
      }
      {
        const actual: AuthContext = await agent.get("/auth/self", $AuthContext);
        const expected: AuthContext = {
          type: AuthType.User,
          scope: AuthScope.Default,
          userId: actualUser.id,
          displayName: "Alice",
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
