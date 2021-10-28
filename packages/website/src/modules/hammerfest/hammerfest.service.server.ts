import { Inject, Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/auth/auth-context";
import { GetHammerfestUserOptions } from "@eternal-twin/core/hammerfest/get-hammerfest-user-options";
import { HammerfestUser } from "@eternal-twin/core/hammerfest/hammerfest-user";
import { HammerfestService as CoreHammerfestService } from "@eternal-twin/core/hammerfest/service";
import { from as rxFrom, Observable } from "rxjs";

import { AUTH_CONTEXT, HAMMERFEST } from "../../server/tokens";
import { HammerfestService } from "./hammerfest.service";

@Injectable()
export class ServerHammerfestService extends HammerfestService {
  readonly #acx: AuthContext;
  readonly #hammerfest: CoreHammerfestService;

  constructor(@Inject(AUTH_CONTEXT) acx: AuthContext, @Inject(HAMMERFEST) hammerfest: CoreHammerfestService) {
    super();
    this.#acx = acx;
    this.#hammerfest = hammerfest;
  }

  getUser(options: Readonly<GetHammerfestUserOptions>): Observable<HammerfestUser | null> {
    return rxFrom(this.#hammerfest.getUser(this.#acx, options));
  }
}
