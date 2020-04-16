import { $AuthContext, AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context.js";
import { AuthScope } from "@eternal-twin/etwin-api-types/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type.js";
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
});
