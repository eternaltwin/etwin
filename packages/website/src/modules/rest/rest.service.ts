import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JsonValueReader } from "kryo-json/lib/json-value-reader";
import { JsonValueWriter } from "kryo-json/lib/json-value-writer";
import { IoType } from "kryo/lib";
import { Observable } from "rxjs";
import { map as rxMap } from "rxjs/operators";

import { environment } from "../../environments/environment";

const JSON_VALUE_READER: JsonValueReader = new JsonValueReader();
const JSON_VALUE_WRITER: JsonValueWriter = new JsonValueWriter();

@Injectable()
export class RestService {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  public get<R>(route: readonly string[], resType: IoType<R>): Observable<R> {
    const uri = this.resolveUri(route);
    return this.http.get(uri, {withCredentials: true})
      .pipe(rxMap((raw): R => {
        try {
          return resType.read(JSON_VALUE_READER, raw);
        } catch (err) {
          console.error(`API Error: ${uri}`);
          console.error(err);
          throw err;
        }
      }));
  }

  public delete<R>(route: readonly string[], resType: IoType<R>): Observable<R> {
    const uri = this.resolveUri(route);
    return this.http.delete(uri, {withCredentials: true})
      .pipe(rxMap((raw): R => {
        try {
          return resType.read(JSON_VALUE_READER, raw);
        } catch (err) {
          console.error(`API Error: ${uri}`);
          console.error(err);
          throw err;
        }
      }));
  }

  public post<Req, Res>(route: readonly string[], reqType: IoType<Req>, req: Req, resType: IoType<Res>): Observable<Res> {
    const uri = this.resolveUri(route);
    const rawReq: object = reqType.write(JSON_VALUE_WRITER, req);
    return this.http.post(uri, rawReq, {withCredentials: true})
      .pipe(rxMap((raw): Res => {
        try {
          return resType.read(JSON_VALUE_READER, raw);
        } catch (err) {
          console.error(`API Error: ${uri}`);
          console.error(err);
          throw err;
        }
      }));
  }

  public resolveUri(route: readonly string[]): string {
    return `${environment.apiBase}/${route.map(encodeURIComponent).join("/")}`;
  }
}
