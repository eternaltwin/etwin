import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Data as AnyRouteData } from "@angular/router";
import { HammerfestUser } from "@eternal-twin/core/hammerfest/hammerfest-user";
import { NEVER as RX_NEVER, Observable } from "rxjs";
import { map as rxMap } from "rxjs/operators";

const HAMMERFEST_USER_NOT_FOUND: unique symbol = Symbol("HAMMERFEST_USER_NOT_FOUND");

export interface HammerfestUserRouteData {
  user: HammerfestUser | null;
}

@Component({
  selector: "etwin-hammerfest-user-view",
  templateUrl: "./hammerfest-user.view.html",
  styleUrls: [],
})
export class HammerfestUserView implements OnInit {
  public user$: Observable<HammerfestUser | typeof HAMMERFEST_USER_NOT_FOUND>;
  public readonly HAMMERFEST_USER_NOT_FOUND = HAMMERFEST_USER_NOT_FOUND;

  readonly #route: ActivatedRoute;

  public constructor(route: ActivatedRoute) {
    this.#route = route;
    this.user$ = RX_NEVER;
  }

  ngOnInit(): void {
    this.user$ = this.#route.data
      .pipe(rxMap((anyData: AnyRouteData): HammerfestUser | typeof HAMMERFEST_USER_NOT_FOUND => {
        const data = anyData as HammerfestUserRouteData;
        return data.user !== null ? data.user : HAMMERFEST_USER_NOT_FOUND;
      }));
  }
}
