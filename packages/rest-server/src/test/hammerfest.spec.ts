import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { $HammerfestUserRef, HammerfestUserRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-ref.js";
import chai from "chai";
import chaiHttp from "chai-http";

import { TestAgent } from "./test-agent.js";
import { withTestServer } from "./test-server.js";

chai.use(chaiHttp);

describe("/hammerfest", () => {
  describe("/users", () => {
    it("should load an unlinked profile for the first time", async function (this: Mocha.Context) {
      this.timeout(30000);
      return withTestServer(async cx => {
        cx.hammerfestClient.createUser("hammerfest.fr", "123", "alice", Buffer.from("aaaaa"));
        const guestAgent: TestAgent = new TestAgent(chai.request.agent(cx.server));
        {
          const actual: HammerfestUserRef = await guestAgent.get("/hammerfest/users/hammerfest.fr/123", $HammerfestUserRef);
          const expected: HammerfestUserRef = {
            type: ObjectType.HammerfestUser,
            server: "hammerfest.fr",
            id: "123",
            username: "alice",
          };
          chai.assert.deepEqual(actual, expected);
        }
      });
    });
    it("should load an unlinked profile for the second time", async function (this: Mocha.Context) {
      this.timeout(30000);
      return withTestServer(async cx => {
        cx.hammerfestClient.createUser("hammerfest.fr", "123", "alice", Buffer.from("aaaaa"));
        const guestAgent: TestAgent = new TestAgent(chai.request.agent(cx.server));
        await guestAgent.get("/hammerfest/users/hammerfest.fr/123", $HammerfestUserRef);
        {
          const actual: HammerfestUserRef = await guestAgent.get("/hammerfest/users/hammerfest.fr/123", $HammerfestUserRef);
          const expected: HammerfestUserRef = {
            type: ObjectType.HammerfestUser,
            server: "hammerfest.fr",
            id: "123",
            username: "alice",
          };
          chai.assert.deepEqual(actual, expected);
        }
      });
    });
    it("should return an error on a missing user", async function (this: Mocha.Context) {
      this.timeout(30000);
      return withTestServer(async cx => {
        const guestAgent: TestAgent = new TestAgent(chai.request.agent(cx.server));
        try {
          await guestAgent.get("/hammerfest/users/hammerfest.fr/9999999", $HammerfestUserRef);
        } catch (e) {
          chai.assert.instanceOf(e, Error);
          chai.assert.strictEqual(e.message, "HammerfestUserNotFound");
          return;
        }
        chai.assert.fail("Expected request to fail");
      });
    });
  });
});
