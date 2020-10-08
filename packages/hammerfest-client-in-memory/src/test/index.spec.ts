import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { HammerfestSession } from "@eternal-twin/core/lib/hammerfest/hammerfest-session.js";
import chai from "chai";

import { InMemoryHammerfestClientService } from "../lib/index.js";

describe("InMemoryHammerfestClientService", () => {
  it("createSession", async () => {
    const hammerfest = new InMemoryHammerfestClientService();

    hammerfest.createUser("hammerfest.fr", 123, "alice", Buffer.from("aaaaa"));

    {
      const actual: HammerfestSession = await hammerfest.createSession(
        {server: "hammerfest.fr", login: "alice", password: Buffer.from("aaaaa")},
      );
      const expected: HammerfestSession = {
        ctime: actual.ctime,
        atime: actual.ctime,
        key: actual.key,
        user: {type: ObjectType.HammerfestUser, server: "hammerfest.fr", id: 123, login: "alice"},
      };
      chai.assert.deepEqual(actual, expected);
    }
  });
});
