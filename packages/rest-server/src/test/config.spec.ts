import { $Config, Config } from "@eternal-twin/core/lib/config/config";
import chai from "chai";
import chaiHttp from "chai-http";

import { populateUsers } from "./populate/users.js";
import { TestAgent } from "./test-agent.js";
import { withTestServer } from "./test-server.js";

chai.use(chaiHttp);

describe("/config", () => {
  it("should return the app config", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(false, async ({server}) => {
      const guestAgent: TestAgent = new TestAgent(chai.request.agent(server));
      const {aliceAgent, bobAgent} = await populateUsers(server);
      {
        const actual: Config = await aliceAgent.get("/config", $Config);
        const expected: Config = {
          forum: {
            postsPerPage: 10,
            threadsPerPage: 20,
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: Config = await bobAgent.get("/config", $Config);
        const expected: Config = {
          forum: {
            postsPerPage: 10,
            threadsPerPage: 20,
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
      {
        const actual: Config = await guestAgent.get("/config", $Config);
        const expected: Config = {
          forum: {
            postsPerPage: 10,
            threadsPerPage: 20,
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
});
