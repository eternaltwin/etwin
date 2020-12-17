import { Injectable } from "@angular/core";
import { $TimeQuery } from "@eternal-twin/core/lib/core/time-query";
import { $DinoparcUser, DinoparcUser } from "@eternal-twin/core/lib/dinoparc/dinoparc-user";
import { GetDinoparcUserOptions } from "@eternal-twin/core/lib/dinoparc/get-dinoparc-user-options";
import { Observable, of as rxOf } from "rxjs";
import { catchError as rxCatchError } from "rxjs/operators";

import { RestService } from "../rest/rest.service";
import { DinoparcService } from "./dinoparc.service";

@Injectable()
export class BrowserDinoparcService extends DinoparcService {
  readonly #rest: RestService;

  constructor(rest: RestService) {
    super();
    this.#rest = rest;
  }

  getUser(options: Readonly<GetDinoparcUserOptions>): Observable<DinoparcUser | null> {
    return this.#rest
      .get(
        ["archive", "dinoparc", options.server, "users", options.id],
        {
          queryType: $TimeQuery,
          query: {time: options.time},
          resType: $DinoparcUser,
        },
      )
      .pipe(
        rxCatchError((err: Error): Observable<null> => {
          return rxOf(null);
        }),
      );
  }
}
