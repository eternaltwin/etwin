import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Data as AnyRouteData } from "@angular/router";
import { TwinoidUser } from "@eternal-twin/core/twinoid/twinoid-user";
import { NEVER as RX_NEVER, Observable } from "rxjs";
import { map as rxMap } from "rxjs/operators";

const TWINOID_USER_NOT_FOUND: unique symbol = Symbol("TWINOID_USER_NOT_FOUND");

export interface TwinoidUserRouteData {
  user: TwinoidUser | null;
}

@Component({
  selector: "etwin-twinoid-user-view",
  templateUrl: "./twinoid-user.view.html",
  styleUrls: [],
})
export class TwinoidUserView implements OnInit {
  public user$: Observable<TwinoidUser | typeof TWINOID_USER_NOT_FOUND>;
  public readonly TWINOID_USER_NOT_FOUND = TWINOID_USER_NOT_FOUND;

  readonly #route: ActivatedRoute;

  public constructor(route: ActivatedRoute) {
    this.#route = route;
    this.user$ = RX_NEVER;
  }

  ngOnInit(): void {
    this.user$ = this.#route.data
      .pipe(rxMap((anyData: AnyRouteData): TwinoidUser | typeof TWINOID_USER_NOT_FOUND => {
        const data = anyData as TwinoidUserRouteData;
        return data.user !== null ? data.user : TWINOID_USER_NOT_FOUND;
      }));
  }
}
