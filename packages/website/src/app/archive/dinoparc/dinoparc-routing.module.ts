import { Injectable, NgModule } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, Router, RouterModule, RouterStateSnapshot, Routes } from "@angular/router";
import { $DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server";
import { DinoparcUser } from "@eternal-twin/core/lib/dinoparc/dinoparc-user";
import { $DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id";
import { $Date } from "kryo/lib/date.js";
import { QS_VALUE_READER } from "kryo-qs/lib/qs-value-reader.js";
import { Observable, of as rxOf } from "rxjs";

import { DinoparcService } from "../../../modules/dinoparc/dinoparc.service";
import { DinoparcHomeView } from "./dinoparc-home.view";
import { DinoparcUserView } from "./dinoparc-user.view";

@Injectable()
export class DinoparcUserResolverService implements Resolve<DinoparcUser | null> {
  readonly #router: Router;
  readonly #dinoparc: DinoparcService;

  constructor(router: Router, dinoparc: DinoparcService) {
    this.#router = router;
    this.#dinoparc = dinoparc;
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<DinoparcUser | null> {
    const server: string | null = route.paramMap.get("server");
    if (server === null || !$DinoparcServer.test(server)) {
      return rxOf(null);
    }
    const userId: string | null = route.paramMap.get("user_id");
    if (userId === null || !$DinoparcUserId.test(userId)) {
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
    return this.#dinoparc.getUser({server, id: userId, time});
  }
}

const routes: Routes = [
  {
    path: "",
    component: DinoparcHomeView,
    pathMatch: "full",
    resolve: {
    },
  },
  {
    path: ":server/users/:user_id",
    component: DinoparcUserView,
    pathMatch: "full",
    resolve: {
      user: DinoparcUserResolverService,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [DinoparcUserResolverService],
})
export class DinoparcRoutingModule {
}
