import { Inject, Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { DinoparcUser } from "@eternal-twin/core/lib/dinoparc/dinoparc-user";
import { GetDinoparcUserOptions } from "@eternal-twin/core/lib/dinoparc/get-dinoparc-user-options";
import { DinoparcService as CoreDinoparcService } from "@eternal-twin/core/lib/dinoparc/service";
import { from as rxFrom, Observable } from "rxjs";

import { AUTH_CONTEXT, HAMMERFEST } from "../../server/tokens";
import { DinoparcService } from "./dinoparc.service";

@Injectable()
export class ServerDinoparcService extends DinoparcService {
  readonly #acx: AuthContext;
  readonly #dinoparc: CoreDinoparcService;

  constructor(@Inject(AUTH_CONTEXT) acx: AuthContext, @Inject(HAMMERFEST) dinoparc: CoreDinoparcService) {
    super();
    this.#acx = acx;
    this.#dinoparc = dinoparc;
  }

  getUser(options: Readonly<GetDinoparcUserOptions>): Observable<DinoparcUser | null> {
    return rxFrom(this.#dinoparc.getUser(this.#acx, options));
  }
}
