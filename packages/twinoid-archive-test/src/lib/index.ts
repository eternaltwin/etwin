import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { SystemAuthContext } from "@eternal-twin/core/lib/auth/system-auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { TwinoidArchiveService } from "@eternal-twin/core/lib/twinoid/archive.js";
import { TwinoidUserRef } from "@eternal-twin/core/lib/twinoid/twinoid-user-ref.js";
import chai from "chai";

export interface Api {
  twinoidArchive: TwinoidArchiveService;
}

const GUEST_AUTH: GuestAuthContext = {type: AuthType.Guest, scope: AuthScope.Default};
const SYSTEM_AUTH: SystemAuthContext = {type: AuthType.System, scope: AuthScope.Default};

export function testTwinoidArchiveService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Retrieve an existing Twinoid user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      await api.twinoidArchive.createOrUpdateUserRef(SYSTEM_AUTH, {type: ObjectType.TwinoidUser, id: "123", displayName: "alice"});

      {
        const actual: TwinoidUserRef | null = await api.twinoidArchive.getUserById(GUEST_AUTH, "123");
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
      await api.twinoidArchive.createOrUpdateUserRef(SYSTEM_AUTH, {type: ObjectType.TwinoidUser, id: "123", displayName: "alice"});

      {
        const actual: TwinoidUserRef | null = await api.twinoidArchive.getUserById(GUEST_AUTH, "9999999");
        const expected: null = null;
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
