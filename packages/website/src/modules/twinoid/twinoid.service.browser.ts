import { Injectable } from "@angular/core";
import { $TimeQuery } from "@eternal-twin/core/lib/core/time-query";
import { GetTwinoidUserOptions } from "@eternal-twin/core/lib/twinoid/get-twinoid-user-options";
import { $TwinoidUser, TwinoidUser } from "@eternal-twin/core/lib/twinoid/twinoid-user";
import { Observable, of as rxOf } from "rxjs";
import { catchError as rxCatchError } from "rxjs/operators";

import { RestService } from "../rest/rest.service";
import { TwinoidService } from "./twinoid.service";

@Injectable()
export class BrowserTwinoidService extends TwinoidService {
  readonly #rest: RestService;

  constructor(rest: RestService) {
    super();
    this.#rest = rest;
  }

  getUser(options: Readonly<GetTwinoidUserOptions>): Observable<TwinoidUser | null> {
    return this.#rest
      .get(
        ["archive", "twinoid", "users", options.id],
        {
          queryType: $TimeQuery,
          query: {time: options.time},
          resType: $TwinoidUser,
        },
      )
      .pipe(
        rxCatchError((err: Error): Observable<null> => {
          return rxOf(null);
        }),
      );
  }
}
