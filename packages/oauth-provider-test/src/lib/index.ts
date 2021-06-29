import { ClockService } from "@eternal-twin/core/lib/clock/service";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type";
import { Url } from "@eternal-twin/core/lib/core/url";
import { OauthClient } from "@eternal-twin/core/lib/oauth/oauth-client";
import { OauthProviderStore } from "@eternal-twin/core/lib/oauth/provider-store";
import chai from "chai";

export interface Api {
  clock: ClockService;
  oauthProviderStore: OauthProviderStore;
}

export function testOauthProviderStore(withApi: (fn: (api: Api) => Promise<void>) => Promise<void>) {
  it("Creates the eternalfest app", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const client: OauthClient = await api.oauthProviderStore.touchSystemClient(
        {
          key: "eternalfest@clients",
          displayName: "Eternalfest",
          appUri: new Url("https://eternalfest.net"),
          callbackUri: new Url("https://eternalfest.net/oauth/callback"),
          secret: Buffer.from("eternalfest_secret"),
        },
      );
      {
        const expected: OauthClient = {
          type: ObjectType.OauthClient,
          id: client.id,
          key: "eternalfest@clients",
          displayName: "Eternalfest",
          appUri: new Url("https://eternalfest.net"),
          callbackUri: new Url("https://eternalfest.net/oauth/callback"),
          owner: null,
        };
        chai.assert.deepEqual(expected, client);
      }
      const retrieved: OauthClient | null = await api.oauthProviderStore.getClientByKey("eternalfest@clients");
      {
        const expected: OauthClient = {
          type: ObjectType.OauthClient,
          id: client.id,
          key: "eternalfest@clients",
          displayName: "Eternalfest",
          appUri: new Url("https://eternalfest.net"),
          callbackUri: new Url("https://eternalfest.net/oauth/callback"),
          owner: null,
        };
        chai.assert.deepEqual(expected, retrieved);
      }
    });
  });

  it("creates the eternalfest app only once", async function (this: Mocha.Context) {
    this.timeout(30000);
    return withApi(async (api: Api): Promise<void> => {
      const first: OauthClient = await api.oauthProviderStore.touchSystemClient(
        {
          key: "eternalfest@clients",
          displayName: "Eternalfest",
          appUri: new Url("https://eternalfest.net"),
          callbackUri: new Url("https://eternalfest.net/oauth/callback"),
          secret: Buffer.from("eternalfest_secret"),
        },
      );
      {
        const expected: OauthClient = {
          type: ObjectType.OauthClient,
          id: first.id,
          key: "eternalfest@clients",
          displayName: "Eternalfest",
          appUri: new Url("https://eternalfest.net"),
          callbackUri: new Url("https://eternalfest.net/oauth/callback"),
          owner: null,
        };
        chai.assert.deepEqual(expected, first);
      }
      const second: OauthClient = await api.oauthProviderStore.touchSystemClient(
        {
          key: "eternalfest@clients",
          displayName: "Eternalfest (Updated)",
          appUri: new Url("https://eternalfest.net"),
          callbackUri: new Url("https://eternalfest.net/oauth/callback"),
          secret: Buffer.from("eternalfest_secret"),
        },
      );
      {
        const expected: OauthClient = {
          type: ObjectType.OauthClient,
          id: first.id,
          key: "eternalfest@clients",
          displayName: "Eternalfest (Updated)",
          appUri: new Url("https://eternalfest.net"),
          callbackUri: new Url("https://eternalfest.net/oauth/callback"),
          owner: null,
        };
        chai.assert.deepEqual(expected, second);
      }
    });
  });
}
