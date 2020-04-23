import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ObjectType } from "@eternal-twin/etwin-api-types/lib/core/object-type";
import { CompleteUser } from "@eternal-twin/etwin-api-types/lib/user/complete-user";
import { User } from "@eternal-twin/etwin-api-types/lib/user/user";
import { NEVER as RX_NEVER, Observable } from "rxjs";
import { map as rxMap } from "rxjs/operators";

const USER_NOT_FOUND: unique symbol = Symbol("USER_NOT_FOUND");

@Component({
  selector: "etwin-user-view",
  templateUrl: "./user-view.component.html",
  styleUrls: [],
})
export class UserViewComponent implements OnInit {
  private readonly route: ActivatedRoute;

  public user$: Observable<User | CompleteUser | typeof USER_NOT_FOUND>;
  public readonly ObjectType = ObjectType;

  constructor(
    route: ActivatedRoute,
  ) {
    this.route = route;
    this.user$ = RX_NEVER;
  }

  ngOnInit(): void {
    interface RouteData {
      user: User | CompleteUser | null;
    }

    const routeData$: Observable<RouteData> = this.route.data as any;
    this.user$ = routeData$.pipe(rxMap(({user}: RouteData) => user !== null ? user : USER_NOT_FOUND));
  }
}
