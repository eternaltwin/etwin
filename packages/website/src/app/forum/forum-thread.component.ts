import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread";
import { NEVER as RX_NEVER, Observable, of as rxOf } from "rxjs";
import { catchError as rxCatchError } from "rxjs/internal/operators/catchError";
import { map as rxMap, startWith as rxStartWith } from "rxjs/operators";

import { AuthService } from "../../modules/auth/auth.service";

const FORUM_THREAD_NOT_FOUND: unique symbol = Symbol("FORUM_THREAD_NOT_FOUND");

@Component({
  selector: "etwin-forum-thread",
  templateUrl: "./forum-thread.component.html",
  styleUrls: [],
})
export class ForumThreadComponent implements OnInit {
  private readonly route: ActivatedRoute;

  public thread$: Observable<ForumThread | typeof FORUM_THREAD_NOT_FOUND>;
  public isAuthenticated$: Observable<boolean>;
  public readonly FORUM_THREAD_NOT_FOUND = FORUM_THREAD_NOT_FOUND;

  constructor(
    auth: AuthService,
    route: ActivatedRoute,
  ) {
    this.route = route;
    this.thread$ = RX_NEVER;
    this.isAuthenticated$ = auth.auth().pipe(
      rxMap((acx) => acx.type !== AuthType.Guest),
      rxStartWith(false),
      rxCatchError(() => rxOf(false)),
    );
  }

  ngOnInit(): void {
    interface RouteData {
      thread: ForumThread | null;
    }

    const routeData$: Observable<RouteData> = this.route.data as any;
    this.thread$ = routeData$.pipe(rxMap(({thread}: RouteData) => thread !== null ? thread : FORUM_THREAD_NOT_FOUND));
  }
}
