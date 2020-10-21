import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { HammerfestArchiveService } from "@eternal-twin/core/lib/hammerfest/archive.js";
import { HammerfestUserRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-ref.js";
import { InMemoryHammerfestClientService } from "@eternal-twin/hammerfest-client-in-memory";
import chai from "chai";

export interface Api {
  hammerfest: HammerfestArchiveService;
  hammerfestClient: InMemoryHammerfestClientService;
}

export function testHammerfestArchiveService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Retrieve an existing Hammerfest user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      api.hammerfestClient.createUser("hammerfest.fr", "123", "alice", Buffer.from("aaaaa"));
      await api.hammerfest.createOrUpdateUserRef({type: ObjectType.HammerfestUser, server: "hammerfest.fr", id: "123", username: "alice"});

      const actual: HammerfestUserRef | null = await api.hammerfest.getUserById("hammerfest.fr", "123");
      {
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

  it("Retrieve a non-existing Hammerfest user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      api.hammerfestClient.createUser("hammerfest.fr", "123", "alice", Buffer.from("aaaaa"));
      await api.hammerfest.createOrUpdateUserRef({type: ObjectType.HammerfestUser, server: "hammerfest.fr", id: "123", username: "alice"});

      const actual: HammerfestUserRef | null = await api.hammerfest.getUserById("hammerfest.fr", "999");
      {
        const expected: null = null;
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
