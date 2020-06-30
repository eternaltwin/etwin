import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JSON_VALUE_READER } from "kryo-json/lib/json-value-reader";
import { JSON_VALUE_WRITER } from "kryo-json/lib/json-value-writer";
import { IoType } from "kryo/lib";
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

  public get<Query, Res>(
    route: readonly string[],
    options: SimpleRequestOptions<Res> | QueryRequestOptions<Query, Res>,
  ): Observable<Res> {
    const uri = this.resolveUri(route);
    const rawQuery: Record<string, string> | undefined = options.queryType !== undefined ? options.queryType.write(JSON_VALUE_WRITER, options.query) : undefined;
    return this.http.get(uri, {withCredentials: true, params: rawQuery})
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

  public post<Req, Res>(
    route: readonly string[],
    reqType: IoType<Req>,
    req: Req,
    resType: IoType<Res>,
  ): Observable<Res> {
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

  public put<Query, Req, Res>(route: readonly string[], options: RequestOptions<Query, Req, Res>): Observable<Res> {
    const uri = this.resolveUri(route);
    const rawReq: object | undefined = options.reqType !== undefined ? options.reqType.write(JSON_VALUE_WRITER, options.req) : undefined;
    const rawQuery: Record<string, string> | undefined = options.queryType !== undefined ? options.queryType.write(JSON_VALUE_WRITER, options.query) : undefined;
    return this.http.put(uri, rawReq, {withCredentials: true, params: rawQuery})
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
