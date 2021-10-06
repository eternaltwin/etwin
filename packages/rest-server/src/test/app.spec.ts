import chai from "chai";
import chaiHttp from "chai-http";
import { $Any } from "kryo/any";

import { TestAgent } from "./test-agent.js";
import { withTestServer } from "./test-server.js";

chai.use(chaiHttp);

describe("/app", () => {
  it("should return data about the latest app release", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withTestServer(false, async ({server}) => {
      const guestAgent: TestAgent = new TestAgent(chai.request.agent(server));
      {
        const actual: unknown = await guestAgent.get("/app/releases", $Any);
        const expected = {
          latest: {
            version: "0.5.4",
            time: "2021-10-06T11:09:00.000Z",
          },
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
});
