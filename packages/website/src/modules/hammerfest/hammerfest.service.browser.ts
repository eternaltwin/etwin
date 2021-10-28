import { Injectable } from "@angular/core";
import { $TimeQuery } from "@eternal-twin/core/core/time-query";
import { GetHammerfestUserOptions } from "@eternal-twin/core/hammerfest/get-hammerfest-user-options";
import { $HammerfestUser, HammerfestUser } from "@eternal-twin/core/hammerfest/hammerfest-user";
import { Observable, of as rxOf } from "rxjs";
import { catchError as rxCatchError } from "rxjs/operators";

import { RestService } from "../rest/rest.service";
import { HammerfestService } from "./hammerfest.service";

@Injectable()
export class BrowserHammerfestService extends HammerfestService {
  readonly #rest: RestService;

  constructor(rest: RestService) {
    super();
    this.#rest = rest;
  }

  getUser(options: Readonly<GetHammerfestUserOptions>): Observable<HammerfestUser | null> {
    return this.#rest
      .get(
        ["archive", "hammerfest", options.server, "users", options.id],
        {
          queryType: $TimeQuery,
          query: {time: options.time},
          resType: $HammerfestUser,
        },
      )
      .pipe(
        rxCatchError((err: Error): Observable<null> => {
          return rxOf(null);
        }),
      );
  }
}
