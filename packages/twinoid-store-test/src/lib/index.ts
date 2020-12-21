import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ShortTwinoidUser } from "@eternal-twin/core/lib/twinoid/short-twinoid-user.js";
import { TwinoidStore } from "@eternal-twin/core/lib/twinoid/store.js";
import chai from "chai";

export interface Api {
  twinoidStore: TwinoidStore;
}

export function testTwinoidArchiveService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Retrieve an existing Twinoid user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      await api.twinoidStore.touchShortUser({type: ObjectType.TwinoidUser, id: "123", displayName: "alice"});

      {
        const actual: ShortTwinoidUser | null = await api.twinoidStore.getUser({id: "123"});
        const expected: ShortTwinoidUser = {
          type: ObjectType.TwinoidUser,
          id: "123",
          displayName: "alice",
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Retrieve a non-existing Twinoid user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      await api.twinoidStore.touchShortUser({type: ObjectType.TwinoidUser, id: "123", displayName: "alice"});

      {
        const actual: ShortTwinoidUser | null = await api.twinoidStore.getUser({id: "9999999"});
        const expected: null = null;
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
