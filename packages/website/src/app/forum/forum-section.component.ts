import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section";
import { NEVER as RX_NEVER, Observable, of as rxOf } from "rxjs";
import { catchError as rxCatchError, map as rxMap, startWith as rxStartWith } from "rxjs/operators";

import { AuthService } from "../../modules/auth/auth.service";

const FORUM_SECTION_NOT_FOUND: unique symbol = Symbol("FORUM_SECTION_NOT_FOUND");

@Component({
  selector: "etwin-forum-section",
  templateUrl: "./forum-section.component.html",
  styleUrls: [],
})
export class ForumSectionComponent implements OnInit {
  private readonly auth: AuthService;
  private readonly route: ActivatedRoute;

  public section$: Observable<ForumSection | typeof FORUM_SECTION_NOT_FOUND>;
  public isAuthenticated$: Observable<boolean>;
  public isAdministrator$: Observable<boolean>;
  public readonly FORUM_SECTION_NOT_FOUND = FORUM_SECTION_NOT_FOUND;
  public readonly floor = Math.floor;
  public readonly ceil = Math.ceil;

  constructor(
    auth: AuthService,
    route: ActivatedRoute,
  ) {
    this.auth = auth;
    this.route = route;
    this.section$ = RX_NEVER;
    this.isAuthenticated$ = auth.auth().pipe(
      rxMap((acx) => acx.type !== AuthType.Guest),
      rxStartWith(false),
      rxCatchError(() => rxOf(false)),
    );
    this.isAdministrator$ = auth.auth().pipe(
      rxMap((acx) => acx.type === AuthType.User && acx.isAdministrator),
      rxStartWith(false),
      rxCatchError(() => rxOf(false)),
    );
  }

  ngOnInit(): void {
    interface RouteData {
      section: ForumSection | null;
    }

    const routeData$: Observable<RouteData> = this.route.data as any;
    this.section$ = routeData$.pipe(rxMap(({section}: RouteData) => section !== null ? section : FORUM_SECTION_NOT_FOUND));
  }
}
