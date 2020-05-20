import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope.js";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type.js";
import { GuestAuthContext } from "@eternal-twin/core/lib/auth/guest-auth-context.js";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type.js";
import { OauthClient } from "@eternal-twin/core/lib/oauth/oauth-client.js";
import { OauthProviderService } from "@eternal-twin/core/lib/oauth/provider-service";
import chai from "chai";

export interface Api {
  oauthProvider: OauthProviderService;
}

const GUEST_AUTH: GuestAuthContext = {type: AuthType.Guest, scope: AuthScope.Default};

export function testOauthProviderService(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Creates the eternalfest app", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const client: OauthClient = await api.oauthProvider.createOrUpdateSystemClient(
        "eternalfest",
        {
          displayName: "Eternalfest",
          appUri: "https://eternalfest.net",
          callbackUri: "https://eternalfest.net/oauth/callback",
          secret: Buffer.from("eternalfest_secret"),
        },
      );
      {
        const expected: OauthClient = {
          type: ObjectType.OauthClient,
          id: client.id,
          key: "eternalfest",
          displayName: "Eternalfest",
          appUri: "https://eternalfest.net",
          callbackUri: "https://eternalfest.net/oauth/callback",
          owner: null,
        };
        chai.assert.deepEqual(expected, client);
      }
      const retrieved: OauthClient | null = await api.oauthProvider.getClientByIdOrKey(GUEST_AUTH, "eternalfest");
      {
        const expected: OauthClient = {
          type: ObjectType.OauthClient,
          id: client.id,
          key: "eternalfest",
          displayName: "Eternalfest",
          appUri: "https://eternalfest.net",
          callbackUri: "https://eternalfest.net/oauth/callback",
          owner: null,
        };
        chai.assert.deepEqual(expected, retrieved);
      }
    });
  });

  it("creates the eternalfest app only once", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const first: OauthClient = await api.oauthProvider.createOrUpdateSystemClient(
        "eternalfest",
        {
          displayName: "Eternalfest",
          appUri: "https://eternalfest.net",
          callbackUri: "https://eternalfest.net/oauth/callback",
          secret: Buffer.from("eternalfest_secret"),
        },
      );
      {
        const expected: OauthClient = {
          type: ObjectType.OauthClient,
          id: first.id,
          key: "eternalfest",
          displayName: "Eternalfest",
          appUri: "https://eternalfest.net",
          callbackUri: "https://eternalfest.net/oauth/callback",
          owner: null,
        };
        chai.assert.deepEqual(expected, first);
      }
      const second: OauthClient = await api.oauthProvider.createOrUpdateSystemClient(
        "eternalfest",
        {
          displayName: "Eternalfest (Updated)",
          appUri: "https://eternalfest.net",
          callbackUri: "https://eternalfest.net/oauth/callback",
          secret: Buffer.from("eternalfest_secret"),
        },
      );
      {
        const expected: OauthClient = {
          type: ObjectType.OauthClient,
          id: first.id,
          key: "eternalfest",
          displayName: "Eternalfest (Updated)",
          appUri: "https://eternalfest.net",
          callbackUri: "https://eternalfest.net/oauth/callback",
          owner: null,
        };
        chai.assert.deepEqual(expected, second);
      }
    });
  });
}
