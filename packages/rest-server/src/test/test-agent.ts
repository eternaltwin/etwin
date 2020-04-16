import { IoType } from "kryo";
import { JsonValueReader } from "kryo-json/lib/json-value-reader.js";
import { JsonValueWriter } from "kryo-json/lib/json-value-writer.js";

const JSON_VALUE_READER: JsonValueReader = new JsonValueReader();
const JSON_VALUE_WRITER: JsonValueWriter = new JsonValueWriter();

export class TestAgent {
  private readonly agent: ChaiHttp.Agent;

  public constructor(agent: ChaiHttp.Agent) {
    this.agent = agent;
  }

  public async rawGet(url: string): Promise<ChaiHttp.Response> {
    return this.agent.get(url).send();
  }

  public async rawPost(url: string, req: object): Promise<ChaiHttp.Response> {
    return this.agent.post(url).send(req);
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

  public async post<Req, Res>(url: string, reqType: IoType<Req>, req: Req, resType: IoType<Res>): Promise<Res> {
    const rawReq: object = reqType.write(JSON_VALUE_WRITER, req);
    const res: ChaiHttp.Response = await this.rawPost(url, rawReq);
    const raw: any = res.body;
    if (typeof raw.error === "string") {
      throw new Error(raw.error);
    } else {
      return resType.read(JSON_VALUE_READER, raw);
    }
  }
}
