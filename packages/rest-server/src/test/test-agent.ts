import { IoType } from "kryo";
import { JsonValueReader } from "kryo-json/lib/json-value-reader.js";

const JSON_VALUE_READER: JsonValueReader = new JsonValueReader();

export class TestAgent {
  private readonly agent: ChaiHttp.Agent;

  public constructor(agent: ChaiHttp.Agent) {
    this.agent = agent;
  }

  public async rawGet(url: string): Promise<ChaiHttp.Response> {
    return this.agent.get(url).send();
  }

  public async get<Res>(url: string, resType: IoType<Res>): Promise<Res> {
    const res: ChaiHttp.Response = await this.rawGet(url);
    const raw: any = res.body;
    if (typeof raw.error === "string") {
      throw new Error(raw.error);
    } else {
      return resType.read(JSON_VALUE_READER, raw);
    }
  }
}
