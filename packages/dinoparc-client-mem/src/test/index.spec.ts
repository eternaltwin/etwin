import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { DinoparcSession } from "@eternal-twin/core/lib/dinoparc/dinoparc-session.js";
import chai from "chai";

import { MemDinoparcClient } from "../lib/index.js";

describe("MemDinoparcClient", () => {
  it("createSession", async () => {
    const dinoparcClient = new MemDinoparcClient();

    await dinoparcClient.createUser("dinoparc.com", "123", "alice", "aaaaa");

    {
      const actual: DinoparcSession = await dinoparcClient.createSession(
        {server: "dinoparc.com", username: "alice", password: "aaaaa"},
      );
      const expected: DinoparcSession = {
        ctime: actual.ctime,
        atime: actual.ctime,
        key: actual.key,
        user: {type: ObjectType.DinoparcUser, server: "dinoparc.com", id: "123", username: "alice"},
      };
      chai.assert.deepEqual(actual, expected);
    }
  });
});
