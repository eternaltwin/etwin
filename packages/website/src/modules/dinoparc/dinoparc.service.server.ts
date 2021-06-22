import { Inject, Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { NullableEtwinDinoparcDinoz } from "@eternal-twin/core/lib/dinoparc/etwin-dinoparc-dinoz";
import { NullableEtwinDinoparcUser } from "@eternal-twin/core/lib/dinoparc/etwin-dinoparc-user";
import { GetDinoparcDinozOptions } from "@eternal-twin/core/lib/dinoparc/get-dinoparc-dinoz-options";
import { GetDinoparcUserOptions } from "@eternal-twin/core/lib/dinoparc/get-dinoparc-user-options";
import { DinoparcService as CoreDinoparcService } from "@eternal-twin/core/lib/dinoparc/service";
import { from as rxFrom, Observable } from "rxjs";

import { AUTH_CONTEXT, DINOPARC } from "../../server/tokens";
import { DinoparcService } from "./dinoparc.service";

@Injectable()
export class ServerDinoparcService extends DinoparcService {
  readonly #acx: AuthContext;
  readonly #dinoparc: CoreDinoparcService;

  constructor(@Inject(AUTH_CONTEXT) acx: AuthContext, @Inject(DINOPARC) dinoparc: CoreDinoparcService) {
    super();
    this.#acx = acx;
    this.#dinoparc = dinoparc;
  }

  getUser(options: Readonly<GetDinoparcUserOptions>): Observable<NullableEtwinDinoparcUser> {
    return rxFrom(this.#dinoparc.getUser(this.#acx, options));
  }

  getDinoz(options: Readonly<GetDinoparcDinozOptions>): Observable<NullableEtwinDinoparcDinoz> {
    return rxFrom(this.#dinoparc.getDinoz(this.#acx, options));
  }
}
