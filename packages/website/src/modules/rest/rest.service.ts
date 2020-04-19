import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JsonValueReader } from "kryo-json/lib/json-value-reader";
import { IoType } from "kryo/lib";
import { Observable } from "rxjs";
import { map as rxMap } from "rxjs/operators";

import { environment } from "../../environments/environment";

const JSON_VALUE_READER: JsonValueReader = new JsonValueReader();

@Injectable()
export class RestService {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  public get<R>(route: readonly string[], resType: IoType<R>): Observable<R> {
    const uri = this.resolveUri(route);
    return this.http.get(uri)
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

  public resolveUri(route: readonly string[]): string {
    return `${environment.apiBase}/${route.map(encodeURIComponent).join("/")}`;
  }
}
