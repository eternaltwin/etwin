import { ObjectType } from "@eternal-twin/core/core/object-type";
import { $HammerfestUser, HammerfestUser } from "@eternal-twin/core/hammerfest/hammerfest-user";
import chai from "chai";
import chaiHttp from "chai-http";

import { TestAgent } from "./test-agent.mjs";
import { withTestServer } from "./test-server.mjs";

chai.use(chaiHttp);

describe("/hammerfest", () => {
  describe("/users", () => {
    it("should load an unlinked profile for the first time", async function (this: Mocha.Context) {
      this.timeout(30000);
      return withTestServer(false, async cx => {
        await cx.hammerfestClient.createUser("hammerfest.fr", "123", "alice", "aaaaa");
        const guestAgent: TestAgent = new TestAgent(chai.request.agent(cx.server));
        {
          const actual: HammerfestUser = await guestAgent.get("/archive/hammerfest/hammerfest.fr/users/123", $HammerfestUser);
          const expected: HammerfestUser = {
            type: ObjectType.HammerfestUser,
            server: "hammerfest.fr",
            id: "123",
            username: "alice",
            archivedAt: actual.archivedAt,
            profile: null,
            items: null,
            etwin: {
              current: null,
              old: [],
            },
          };
          chai.assert.deepEqual(actual, expected);
        }
      });
    });
    it("should load an unlinked profile for the second time", async function (this: Mocha.Context) {
      this.timeout(30000);
      return withTestServer(false, async cx => {
        await cx.hammerfestClient.createUser("hammerfest.fr", "123", "alice", "aaaaa");
        const guestAgent: TestAgent = new TestAgent(chai.request.agent(cx.server));
        await guestAgent.get("/archive/hammerfest/hammerfest.fr/users/123", $HammerfestUser);
        {
          const actual: HammerfestUser = await guestAgent.get("/archive/hammerfest/hammerfest.fr/users/123", $HammerfestUser);
          const expected: HammerfestUser = {
            type: ObjectType.HammerfestUser,
            server: "hammerfest.fr",
            id: "123",
            username: "alice",
            archivedAt: actual.archivedAt,
            profile: null,
            items: null,
            etwin: {
              current: null,
              old: [],
            },
          };
          chai.assert.deepEqual(actual, expected);
        }
      });
    });
    it("should return an error on a missing user", async function (this: Mocha.Context) {
      this.timeout(30000);
      return withTestServer(false, async cx => {
        const guestAgent: TestAgent = new TestAgent(chai.request.agent(cx.server));
        try {
          await guestAgent.get("/archive/hammerfest/hammerfest.fr/users/9999999", $HammerfestUser);
        } catch (e) {
          chai.assert.instanceOf(e, Error);
          chai.assert.strictEqual((e as any).message, "HammerfestUserNotFound");
          return;
        }
        chai.assert.fail("Expected request to fail");
      });
    });
  });
});
