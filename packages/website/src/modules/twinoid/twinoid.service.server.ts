import { Inject, Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { GetTwinoidUserOptions } from "@eternal-twin/core/lib/twinoid/get-twinoid-user-options";
import { TwinoidService as CoreTwinoidService } from "@eternal-twin/core/lib/twinoid/service";
import { TwinoidUser } from "@eternal-twin/core/lib/twinoid/twinoid-user";
import { from as rxFrom, Observable } from "rxjs";

import { AUTH_CONTEXT, TWINOID } from "../../server/tokens";
import { TwinoidService } from "./twinoid.service";

@Injectable()
export class ServerTwinoidService extends TwinoidService {
  readonly #acx: AuthContext;
  readonly #twinoid: CoreTwinoidService;

  constructor(@Inject(AUTH_CONTEXT) acx: AuthContext, @Inject(TWINOID) twinoid: CoreTwinoidService) {
    super();
    this.#acx = acx;
    this.#twinoid = twinoid;
  }

  getUser(options: Readonly<GetTwinoidUserOptions>): Observable<TwinoidUser | null> {
    return rxFrom(this.#twinoid.getUser(this.#acx, options));
  }
}
