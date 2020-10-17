import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { SystemAuthContext } from "@eternal-twin/core/lib/auth/system-auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { TwinoidUserRef } from "@eternal-twin/core/lib/twinoid/twinoid-user-ref.js";
import chai from "chai";

import { InMemoryTwinoidService } from "../lib/index.js";

const GUEST_AUTH: GuestAuthContext = {type: AuthType.Guest, scope: AuthScope.Default};
const SYSTEM_AUTH: SystemAuthContext = {type: AuthType.System, scope: AuthScope.Default};

describe("InMemoryTwinoidService", () => {
  it("retrieve an existing user", async () => {
    const twinoid = new InMemoryTwinoidService();
    await twinoid.createOrUpdateUserRef(SYSTEM_AUTH, {type: ObjectType.TwinoidUser, id: "123", displayName: "alice"});

    {
      const actual: TwinoidUserRef | null = await twinoid.getUserById(GUEST_AUTH, "123");
      const expected: TwinoidUserRef = {
        type: ObjectType.TwinoidUser,
        id: "123",
        displayName: "alice",
      };
      chai.assert.deepEqual(actual, expected);
    }
  });
  it("do not retrieve a missing user", async () => {
    const twinoid = new InMemoryTwinoidService();
    await twinoid.createOrUpdateUserRef(SYSTEM_AUTH, {type: ObjectType.TwinoidUser, id: "123", displayName: "alice"});

    {
      const actual: TwinoidUserRef | null = await twinoid.getUserById(GUEST_AUTH, "9999999");
      const expected: null = null;
      chai.assert.deepEqual(actual, expected);
    }
  });
});
