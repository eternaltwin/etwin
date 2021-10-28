import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Data as AnyRouteData } from "@angular/router";
import { EtwinDinoparcUser, NullableEtwinDinoparcUser } from "@eternal-twin/core/dinoparc/etwin-dinoparc-user";
import { NEVER as RX_NEVER, Observable } from "rxjs";
import { map as rxMap } from "rxjs/operators";

const DINOPARC_USER_NOT_FOUND: unique symbol = Symbol("DINOPARC_USER_NOT_FOUND");

export interface DinoparcUserRouteData {
  user: NullableEtwinDinoparcUser;
}

@Component({
  selector: "etwin-dinoparc-user-view",
  templateUrl: "./dinoparc-user.view.html",
  styleUrls: [],
})
export class DinoparcUserView implements OnInit {
  public user$: Observable<EtwinDinoparcUser | typeof DINOPARC_USER_NOT_FOUND>;
  public readonly DINOPARC_USER_NOT_FOUND = DINOPARC_USER_NOT_FOUND;

  readonly #route: ActivatedRoute;

  public constructor(route: ActivatedRoute) {
    this.#route = route;
    this.user$ = RX_NEVER;
  }

  ngOnInit(): void {
    this.user$ = this.#route.data
      .pipe(rxMap((anyData: AnyRouteData): EtwinDinoparcUser | typeof DINOPARC_USER_NOT_FOUND => {
        const data = anyData as DinoparcUserRouteData;
        return data.user !== null ? data.user : DINOPARC_USER_NOT_FOUND;
      }));
  }
}
