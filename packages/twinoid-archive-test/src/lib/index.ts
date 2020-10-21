import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { TwinoidArchiveService } from "@eternal-twin/core/lib/twinoid/archive.js";
import { TwinoidUserRef } from "@eternal-twin/core/lib/twinoid/twinoid-user-ref.js";
import chai from "chai";

export interface Api {
  twinoidArchive: TwinoidArchiveService;
}

export function testTwinoidArchiveService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Retrieve an existing Twinoid user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      await api.twinoidArchive.createOrUpdateUserRef({type: ObjectType.TwinoidUser, id: "123", displayName: "alice"});

      {
        const actual: TwinoidUserRef | null = await api.twinoidArchive.getUserById("123");
        const expected: TwinoidUserRef = {
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
      await api.twinoidArchive.createOrUpdateUserRef({type: ObjectType.TwinoidUser, id: "123", displayName: "alice"});

      {
        const actual: TwinoidUserRef | null = await api.twinoidArchive.getUserById("9999999");
        const expected: null = null;
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
