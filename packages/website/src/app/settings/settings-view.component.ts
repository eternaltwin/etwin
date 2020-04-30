import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { CompleteUser } from "@eternal-twin/core/lib/user/complete-user";
import { Observable } from "rxjs";
import { NEVER as RX_NEVER } from "rxjs/internal/observable/never";
import { map as rxMap } from "rxjs/internal/operators/map";

const RESOLUTION_ERROR: unique symbol = Symbol("RESOLUTION_ERROR");

@Component({
  selector: "etwin-legal-view",
  templateUrl: "./settings-view.component.html",
  styleUrls: [],
})
export class SettingsViewComponent implements OnInit {
  private readonly route: ActivatedRoute;

  public user$: Observable<CompleteUser | typeof RESOLUTION_ERROR>;
  public readonly RESOLUTION_ERROR = RESOLUTION_ERROR;

  constructor(
    route: ActivatedRoute,
  ) {
    this.route = route;
    this.user$ = RX_NEVER;
  }

  ngOnInit(): void {
    interface RouteData {
      user: CompleteUser | null;
    }

    const routeData$: Observable<RouteData> = this.route.data as any;
    this.user$ = routeData$.pipe(rxMap(({user}: RouteData) => user !== null ? user : RESOLUTION_ERROR));
  }
}
