import { InMemoryApi } from "../lib/api.js";
import * as assert from "assert";
import { User } from "@eternal-twin/etwin-api-types/user/user.js";

describe("InMemoryApi", () => {
  it("getUserById", async () => {
    const api = new InMemoryApi();
    const alice: User = {
      id: "aa-a-a",
      displayName: "Alice",
    };
    api.addInMemoryUser(alice);
    const user = await api.getUserById("foo", "bar", "aa-a-a");
    assert.strictEqual(user, alice);
  });
});
