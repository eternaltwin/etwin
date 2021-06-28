import { Injectable, NgModule } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, Router, RouterModule, RouterStateSnapshot, Routes } from "@angular/router";
import { TwinoidUser } from "@eternal-twin/core/lib/twinoid/twinoid-user";
import { $TwinoidUserId } from "@eternal-twin/core/lib/twinoid/twinoid-user-id";
import { $Date } from "kryo/lib/date";
import { QS_VALUE_READER } from "kryo-qs/lib/qs-value-reader";
import { Observable, of as rxOf } from "rxjs";

import { TwinoidService } from "../../../modules/twinoid/twinoid.service";
import { TwinoidHomeView } from "./twinoid-home.view";
import { TwinoidUserView } from "./twinoid-user.view";

@Injectable()
export class TwinoidUserResolverService implements Resolve<TwinoidUser | null> {
  readonly #router: Router;
  readonly #twinoid: TwinoidService;

  constructor(router: Router, twinoid: TwinoidService) {
    this.#router = router;
    this.#twinoid = twinoid;
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<TwinoidUser | null> {
    const userId: string | null = route.paramMap.get("user_id");
    if (userId === null || !$TwinoidUserId.test(userId)) {
      return rxOf(null);
    }
    const rawTime: string | null = route.queryParamMap.get("time");
    let time: Date | undefined;
    try {
      if (rawTime !== null) {
        time = $Date.read(QS_VALUE_READER, rawTime);
      }
    } catch {
      // Ignore invalide `time` query param.
    }
    return this.#twinoid.getUser({id: userId, time});
  }
}

const routes: Routes = [
  {
    path: "",
    component: TwinoidHomeView,
    pathMatch: "full",
    resolve: {
    },
  },
  {
    path: "users/:user_id",
    component: TwinoidUserView,
    pathMatch: "full",
    resolve: {
      user: TwinoidUserResolverService,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [TwinoidUserResolverService],
})
export class TwinoidRoutingModule {
}
