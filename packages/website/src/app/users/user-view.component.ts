import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type";
import { MaybeCompleteUser } from "@eternal-twin/core/lib/user/maybe-complete-user";
import { User } from "@eternal-twin/core/lib/user/user";
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

  public user$: Observable<MaybeCompleteUser | typeof USER_NOT_FOUND>;
  public readonly ObjectType = ObjectType;
  public readonly USER_NOT_FOUND = USER_NOT_FOUND;

  constructor(
    route: ActivatedRoute,
  ) {
    this.route = route;
    this.user$ = RX_NEVER;
  }

  ngOnInit(): void {
    interface RouteData {
      user: MaybeCompleteUser | null;
    }

    const routeData$: Observable<RouteData> = this.route.data as any;
    this.user$ = routeData$.pipe(rxMap(({user}: RouteData) => user !== null ? user : USER_NOT_FOUND));
  }
}
