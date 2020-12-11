import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IoType } from "kryo/lib";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer";
import { Observable } from "rxjs";
import { map as rxMap } from "rxjs/operators";

import { environment } from "../../environments/environment";

export interface SimpleRequestOptions<Res> {
  queryType?: undefined,
  query?: undefined,
  reqType?: undefined,
  req?: undefined,
  resType: IoType<Res>,
}

export interface QueryRequestOptions<Query, Res> {
  queryType: IoType<Query>,
  query: Query,
  reqType?: undefined,
  req?: undefined,
  resType: IoType<Res>,
}

export interface BodyRequestOptions<Req, Res> {
  queryType?: undefined,
  query?: undefined,
  reqType: IoType<Req>,
  req: Req,
  resType: IoType<Res>,
}

export interface CompleteRequestOptions<Query, Req, Res> {
  queryType: IoType<Query>,
  query: Query,
  reqType: IoType<Req>,
  req: Req,
  resType: IoType<Res>,
}

export type RequestOptions<Query, Req, Res> =
  SimpleRequestOptions<Res>
  | QueryRequestOptions<Query, Res>
  | BodyRequestOptions<Req, Res>
  | CompleteRequestOptions<Query, Req, Res>;

@Injectable()
export class RestService {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  public delete<Query, Req, Res>(route: readonly string[], options: RequestOptions<Query, Req, Res>): Observable<Res> {
    return this.request("delete", route, options);
  }

  public get<Query, Res>(route: readonly string[], options: SimpleRequestOptions<Res> | QueryRequestOptions<Query, Res>): Observable<Res> {
    return this.request("get", route, options);
  }

  public patch<Query, Req, Res>(route: readonly string[], options: RequestOptions<Query, Req, Res>): Observable<Res> {
    return this.request("patch", route, options);
  }

  public post<Query, Req, Res>(route: readonly string[], options: RequestOptions<Query, Req, Res>): Observable<Res> {
    return this.request("post", route, options);
  }

  public put<Query, Req, Res>(route: readonly string[], options: RequestOptions<Query, Req, Res>): Observable<Res> {
    return this.request("put", route, options);
  }

  private request<Query, Req, Res>(method: string, route: readonly string[], options: RequestOptions<Query, Req, Res>): Observable<Res> {
    const uri = this.resolveUri(route);
    const rawReq: object | undefined = options.reqType !== undefined ? options.reqType.write(JSON_VALUE_WRITER, options.req) : undefined;
    const rawQuery: Record<string, string> | undefined = options.queryType !== undefined ? options.queryType.write(JSON_VALUE_WRITER, options.query) : undefined;
    return this.http.request(method, uri, {body: rawReq, withCredentials: true, params: rawQuery})
      .pipe(rxMap((raw): Res => {
        try {
          return options.resType.read(JSON_VALUE_READER, raw);
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
