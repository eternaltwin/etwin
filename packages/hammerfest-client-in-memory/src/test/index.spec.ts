import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import chai from "chai";

import { InMemoryHammerfestClientService } from "../lib/index.js";

describe("InMemoryHammerfestClientService", () => {
  it("createSession", async () => {
    const hammerfest = new InMemoryHammerfestClientService();

    hammerfest.createUser("hammerfest.fr", "123", "alice", "aaaaa");

    {
      const actual: HammerfestSession = await hammerfest.createSession(
        {server: "hammerfest.fr", username: "alice", password: "aaaaa"},
      );
      const expected: HammerfestSession = {
        ctime: actual.ctime,
        atime: actual.ctime,
        key: actual.key,
        user: {type: ObjectType.HammerfestUser, server: "hammerfest.fr", id: "123", username: "alice"},
      };
      chai.assert.deepEqual(actual, expected);
    }
  });
});
