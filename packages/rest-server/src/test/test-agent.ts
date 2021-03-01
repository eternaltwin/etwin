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

  public async rawDelete(url: string, req: object): Promise<ChaiHttp.Response> {
    return this.agent.delete(url).send(req);
  }

  public async rawGet(url: string): Promise<ChaiHttp.Response> {
    return this.agent.get(url).send();
  }

  public async rawPatch(url: string, req: object): Promise<ChaiHttp.Response> {
    return this.agent.patch(url).send(req);
  }

  public async rawPost(url: string, req: object): Promise<ChaiHttp.Response> {
    return this.agent.post(url).send(req);
  }

  public async rawPut(url: string, req: object): Promise<ChaiHttp.Response> {
    return this.agent.put(url).send(req);
  }

  public async delete<Req, Res>(url: string, reqType: IoType<Req>, req: Req, resType: IoType<Res>): Promise<Res> {
    const rawReq: object = reqType.write(JSON_VALUE_WRITER, req);
    const res: ChaiHttp.Response = await this.rawDelete(url, rawReq);
    const raw: any = res.body;
    if (typeof raw.error === "string") {
      throw new Error(raw.error);
    } else {
      try {
        return resType.read(JSON_VALUE_READER, raw);
      } catch (err) {
        console.error(`DELETE ${url}:`);
        console.error(JSON.stringify(rawReq));
        console.error(`Response (${res.status}):`);
        console.error(JSON.stringify(res.body));
        throw err;
      }
    }
  }

  public async get<Res>(url: string, resType: IoType<Res>): Promise<Res> {
    const res: ChaiHttp.Response = await this.rawGet(url);
    const raw: any = res.body;
    if (typeof raw.error === "string") {
      throw new Error(raw.error);
    } else {
      try {
        return resType.read(JSON_VALUE_READER, raw);
      } catch (err) {
        console.error(`GET ${url}`);
        console.error(`Response (${res.status}):`);
        console.error(JSON.stringify(res.body));
        throw err;
      }
    }
  }

  public async patch<Req, Res>(url: string, reqType: IoType<Req>, req: Req, resType: IoType<Res>): Promise<Res> {
    const rawReq: object = reqType.write(JSON_VALUE_WRITER, req);
    const res: ChaiHttp.Response = await this.rawPatch(url, rawReq);
    const raw: any = res.body;
    if (typeof raw.error === "string") {
      throw new Error(raw.error);
    } else {
      try {
        return resType.read(JSON_VALUE_READER, raw);
      } catch (err) {
        console.error(`PATCH ${url}:`);
        console.error(JSON.stringify(rawReq));
        console.error(`Response (${res.status}):`);
        console.error(JSON.stringify(res.body));
        throw err;
      }
    }
  }

  public async post<Req, Res>(url: string, reqType: IoType<Req>, req: Req, resType: IoType<Res>): Promise<Res> {
    const rawReq: object = reqType.write(JSON_VALUE_WRITER, req);
    const res: ChaiHttp.Response = await this.rawPost(url, rawReq);
    const raw: any = res.body;
    if (typeof raw.error === "string") {
      throw new Error(raw.error);
    } else {
      try {
        return resType.read(JSON_VALUE_READER, raw);
      } catch (err) {
        console.error(`POST ${url}:`);
        console.error(JSON.stringify(rawReq));
        console.error(`Response (${res.status}):`);
        console.error(JSON.stringify(res.body));
        throw err;
      }
    }
  }

  public async put<Req, Res>(url: string, reqType: IoType<Req>, req: Req, resType: IoType<Res>): Promise<Res> {
    const rawReq: object = reqType.write(JSON_VALUE_WRITER, req);
    const res: ChaiHttp.Response = await this.rawPut(url, rawReq);
    const raw: any = res.body;
    if (typeof raw.error === "string") {
      throw new Error(raw.error);
    } else {
      try {
        return resType.read(JSON_VALUE_READER, raw);
      } catch (err) {
        console.error(`PUT ${url}:`);
        console.error(JSON.stringify(rawReq));
        console.error(`Response (${res.status}):`);
        console.error(JSON.stringify(res.body));
        throw err;
      }
    }
  }
}
