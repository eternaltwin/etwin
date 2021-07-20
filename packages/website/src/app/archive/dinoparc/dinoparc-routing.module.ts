import { Injectable, NgModule } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, Router, RouterModule, RouterStateSnapshot, Routes } from "@angular/router";
import { $DinoparcDinozId } from "@eternal-twin/core/lib/dinoparc/dinoparc-dinoz-id";
import { $DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server";
import { $DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id";
import { NullableEtwinDinoparcDinoz } from "@eternal-twin/core/lib/dinoparc/etwin-dinoparc-dinoz";
import { NullableEtwinDinoparcUser } from "@eternal-twin/core/lib/dinoparc/etwin-dinoparc-user";
import { $Date } from "kryo/date";
import { QS_VALUE_READER } from "kryo-qs/qs-value-reader";
import { Observable, of as rxOf } from "rxjs";

import { DinoparcService } from "../../../modules/dinoparc/dinoparc.service";
import { DinoparcDinozView } from "./dinoparc-dinoz.view";
import { DinoparcHomeView } from "./dinoparc-home.view";
import { DinoparcUserView } from "./dinoparc-user.view";

@Injectable()
export class DinoparcUserResolverService implements Resolve<NullableEtwinDinoparcUser> {
  readonly #router: Router;
  readonly #dinoparc: DinoparcService;

  constructor(router: Router, dinoparc: DinoparcService) {
    this.#router = router;
    this.#dinoparc = dinoparc;
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<NullableEtwinDinoparcUser> {
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
      // Ignore invalid `time` query param.
    }
    return this.#dinoparc.getUser({server, id: userId, time});
  }
}

@Injectable()
export class DinoparcDinozResolverService implements Resolve<NullableEtwinDinoparcDinoz> {
  readonly #router: Router;
  readonly #dinoparc: DinoparcService;

  constructor(router: Router, dinoparc: DinoparcService) {
    this.#router = router;
    this.#dinoparc = dinoparc;
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<NullableEtwinDinoparcDinoz> {
    const server: string | null = route.paramMap.get("server");
    if (server === null || !$DinoparcServer.test(server)) {
      return rxOf(null);
    }
    const dinozId: string | null = route.paramMap.get("dinoz_id");
    if (dinozId === null || !$DinoparcDinozId.test(dinozId)) {
      return rxOf(null);
    }
    const rawTime: string | null = route.queryParamMap.get("time");
    let time: Date | undefined;
    try {
      if (rawTime !== null) {
        time = $Date.read(QS_VALUE_READER, rawTime);
      }
    } catch {
      // Ignore invalid `time` query param.
    }
    return this.#dinoparc.getDinoz({server, id: dinozId, time});
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
  {
    path: ":server/dinoz/:dinoz_id",
    component: DinoparcDinozView,
    pathMatch: "full",
    resolve: {
      dinoz: DinoparcDinozResolverService,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [DinoparcDinozResolverService, DinoparcUserResolverService],
})
export class DinoparcRoutingModule {
}
