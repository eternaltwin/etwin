import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { ShortDinoparcUser } from "@eternal-twin/core/lib/dinoparc/short-dinoparc-user.js";
import { DinoparcStore } from "@eternal-twin/core/lib/dinoparc/store.js";
import chai from "chai";

export interface Api {
  dinoparcStore: DinoparcStore;
}

export function testDinoparcStore(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Retrieve an existing Dinoparc user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      await api.dinoparcStore.touchShortUser({type: ObjectType.DinoparcUser, server: "dinoparc.com", id: "123", username: "alice"});

      const actual: ShortDinoparcUser | null = await api.dinoparcStore.getShortUser({server: "dinoparc.com", id: "123"});
      {
        const expected: ShortDinoparcUser = {
          type: ObjectType.DinoparcUser,
          server: "dinoparc.com",
          id: "123",
          username: "alice",
        };
        chai.assert.deepEqual(actual, expected);
      }
    });
  });

  it("Retrieve a non-existing Dinoparc user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      await api.dinoparcStore.touchShortUser({type: ObjectType.DinoparcUser, server: "dinoparc.com", id: "123", username: "alice"});

      const actual: ShortDinoparcUser | null = await api.dinoparcStore.getShortUser({server: "dinoparc.com", id: "999"});
      {
        const expected: null = null;
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
