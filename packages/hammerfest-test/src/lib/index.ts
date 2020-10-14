import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { HammerfestUserRef } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-ref.js";
import { HammerfestService } from "@eternal-twin/core/lib/hammerfest/service.js";
import { InMemoryHammerfestClientService } from "@eternal-twin/hammerfest-client-in-memory";
import chai from "chai";

export interface Api {
  hammerfest: HammerfestService;
  hammerfestClient: InMemoryHammerfestClientService;
}

const GUEST_AUTH: GuestAuthContext = {type: AuthType.Guest, scope: AuthScope.Default};

export function testHammerfestService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Retrieve an existing Hammerfest user", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      api.hammerfestClient.createUser("hammerfest.fr", "123", "alice", Buffer.from("aaaaa"));

      const actual: HammerfestUserRef | null = await api.hammerfest.getUserById(GUEST_AUTH, "hammerfest.fr", "123");
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

      const actual: HammerfestUserRef | null = await api.hammerfest.getUserById(GUEST_AUTH, "hammerfest.fr", "999");
      {
        const expected: null = null;
        chai.assert.deepEqual(actual, expected);
      }
    });
  });
}
