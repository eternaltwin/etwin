import { TwinoidApiClient } from "@eternal-twin/twinoid-api-types";
import { AccessToken } from "@eternal-twin/twinoid-api-types/lib/access-token.js";
import { User } from "@eternal-twin/twinoid-api-types/lib/user.js";
import superagent from "superagent";
import url from "url";

export class HttpTwinoidApiClient implements TwinoidApiClient {
  private readonly agent: superagent.SuperAgent<superagent.SuperAgentRequest>;
  private readonly apiBaseUri: string;

  constructor(apiBaseUri: string = "http://twinoid.com/graph") {
    this.agent = superagent.agent();
    this.apiBaseUri = apiBaseUri;
  }

  async getMe(at: AccessToken): Promise<Partial<User>> {
    const uri: url.URL = this.resolveUri(["me"]);
    uri.searchParams.set("access_token", at);
    const rawResult: unknown = this.agent.get(uri.toString()).send();
    if (typeof rawResult !== "object" || rawResult === null) {
      throw new Error("InvalidResultType");
    }
    if (Reflect.get(rawResult, "id") === undefined && Reflect.get(rawResult, "name") === undefined) {
      throw new Error("Missing fields: id, name");
    }
    return rawResult;
  }

  async getUser(_at: AccessToken, _id: number): Promise<User | null> {
    throw new Error("NotImplemented");
  }

  async getUsers(_at: AccessToken, _ids: readonly number[]): Promise<User[]> {
    throw new Error("NotImplemented");
  }

  public resolveUri(route: readonly string[]): url.URL {
    return new url.URL(`${this.apiBaseUri}/${route.map(encodeURIComponent).join("/")}`);
  }
}
