import { Injectable, NgModule } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, Router, RouterModule, RouterStateSnapshot, Routes } from "@angular/router";
import { $HammerfestServer } from "@eternal-twin/core/lib/hammerfest/hammerfest-server";
import { HammerfestUser } from "@eternal-twin/core/lib/hammerfest/hammerfest-user";
import { $HammerfestUserId } from "@eternal-twin/core/lib/hammerfest/hammerfest-user-id";
import { $Date } from "kryo/lib/date";
import { QS_VALUE_READER } from "kryo-qs/lib/qs-value-reader";
import { Observable, of as rxOf } from "rxjs";

import { HammerfestService } from "../../../modules/hammerfest/hammerfest.service";
import { HammerfestHomeView } from "./hammerfest-home.view";
import { HammerfestUserView } from "./hammerfest-user.view";

@Injectable()
export class HammerfestUserResolverService implements Resolve<HammerfestUser | null> {
  readonly #router: Router;
  readonly #hammerfest: HammerfestService;

  constructor(router: Router, hammerfest: HammerfestService) {
    this.#router = router;
    this.#hammerfest = hammerfest;
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<HammerfestUser | null> {
    const server: string | null = route.paramMap.get("server");
    if (server === null || !$HammerfestServer.test(server)) {
      return rxOf(null);
    }
    const userId: string | null = route.paramMap.get("user_id");
    if (userId === null || !$HammerfestUserId.test(userId)) {
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
    return this.#hammerfest.getUser({server, id: userId, time});
  }
}

const routes: Routes = [
  {
    path: "",
    component: HammerfestHomeView,
    pathMatch: "full",
    resolve: {
    },
  },
  {
    path: ":server/users/:user_id",
    component: HammerfestUserView,
    pathMatch: "full",
    resolve: {
      user: HammerfestUserResolverService,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [HammerfestUserResolverService],
})
export class HammerfestRoutingModule {
}
