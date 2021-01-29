import { RfcOauthAccessTokenKey } from "@eternal-twin/core/lib/oauth/rfc-oauth-access-token-key";
import { TwinoidClient } from "@eternal-twin/core/lib/twinoid/client.js";
import { TwinoidUser } from "@eternal-twin/core/lib/twinoid/twinoid-user.js";
import { TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id.js";
import superagent from "superagent";
import url from "url";

export class HttpTwinoidClientService implements TwinoidClient {
  private readonly agent: superagent.SuperAgent<superagent.SuperAgentRequest>;
  private readonly apiBaseUri: string;

  constructor(apiBaseUri: string = "https://twinoid.com/graph") {
    this.agent = superagent.agent();
    this.apiBaseUri = apiBaseUri;
  }

  async getMe(at: RfcOauthAccessTokenKey): Promise<Pick<TwinoidUser, "id" | "displayName"> & Partial<TwinoidUser>> {
    const uri: url.URL = this.resolveUri(["me"]);
    uri.searchParams.set("access_token", at);
    console.log(uri.toString());
    const rawResult: unknown = (await this.agent.get(uri.toString()).send()).body;
    if (typeof rawResult !== "object" || rawResult === null) {
      throw new Error("InvalidResultType");
    }
    if (Reflect.get(rawResult, "id") === undefined && Reflect.get(rawResult, "name") === undefined) {
      throw new Error("Missing fields: id, name");
    }
    return {...rawResult, id: (rawResult as any).id.toString(10), displayName: (rawResult as any).name} as Pick<TwinoidUser, "id" | "displayName"> & Partial<TwinoidUser>;
  }

  async getUser(_at: RfcOauthAccessTokenKey, _id: TwinoidUserId): Promise<TwinoidUser | null> {
    throw new Error("NotImplemented");
  }

  async getUsers(_at: RfcOauthAccessTokenKey, _ids: readonly TwinoidUserId[]): Promise<TwinoidUser[]> {
    throw new Error("NotImplemented");
  }

  public resolveUri(route: readonly string[]): url.URL {
    return new url.URL(`${this.apiBaseUri}/${route.map(encodeURIComponent).join("/")}`);
  }
}
