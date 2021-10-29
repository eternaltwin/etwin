import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AuthType } from "@eternal-twin/core/auth/auth-type";
import { ForumRole } from "@eternal-twin/core/forum/forum-role";
import { ForumThread } from "@eternal-twin/core/forum/forum-thread";
import { NEVER as RX_NEVER, Observable, of as rxOf } from "rxjs";
import { catchError as rxCatchError,map as rxMap, startWith as rxStartWith } from "rxjs/operators";

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
  public canEditPosts$: Observable<boolean>;
  public readonly FORUM_THREAD_NOT_FOUND = FORUM_THREAD_NOT_FOUND;
  public readonly floor = Math.floor;
  public readonly ceil = Math.ceil;

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
    this.canEditPosts$ = this.thread$.pipe(
      rxMap((thread: ForumThread | typeof FORUM_THREAD_NOT_FOUND): boolean => {
        if (thread === FORUM_THREAD_NOT_FOUND) {
          return false;
        }
        const roles: ForumRole[] = thread.section.self.roles;
        return roles.includes(ForumRole.Moderator) || roles.includes(ForumRole.Administrator);
      }),
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
    this.canEditPosts$ = this.thread$.pipe(
      rxMap((thread: ForumThread | typeof FORUM_THREAD_NOT_FOUND): boolean => {
        if (thread === FORUM_THREAD_NOT_FOUND) {
          return false;
        }
        const roles: ForumRole[] = thread.section.self.roles;
        return roles.includes(ForumRole.Moderator) || roles.includes(ForumRole.Administrator);
      }),
      rxStartWith(false),
      rxCatchError(() => rxOf(false)),
    );
  }
}
