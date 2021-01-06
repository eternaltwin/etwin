import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ArchivedHammerfestUser } from "@eternal-twin/core/lib/hammerfest/archived-hammerfest-user.js";
import { HammerfestStore } from "@eternal-twin/core/lib/hammerfest/store.js";
import chai from "chai";

export interface Api {
  hammerfestStore: HammerfestStore;
}

export function testHammerfestStore(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Retrieve an existing Hammerfest user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      await api.hammerfestStore.touchShortUser({type: ObjectType.HammerfestUser, server: "hammerfest.fr", id: "123", username: "alice"});

      const actual: ArchivedHammerfestUser | null = await api.hammerfestStore.getUser({server: "hammerfest.fr", id: "123"});
      {
        const expected: ArchivedHammerfestUser = {
          type: ObjectType.HammerfestUser,
          server: "hammerfest.fr",
          id: "123",
          username: "alice",
          archivedAt: actual!.archivedAt,
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Retrieve a non-existing Hammerfest user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      await api.hammerfestStore.touchShortUser({type: ObjectType.HammerfestUser, server: "hammerfest.fr", id: "123", username: "alice"});

      const actual: ArchivedHammerfestUser | null = await api.hammerfestStore.getUser({server: "hammerfest.fr", id: "999"});
      {
        const expected: null = null;
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
