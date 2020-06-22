import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ForumThread } from "@eternal-twin/core/lib/forum/forum-thread";
import { NEVER as RX_NEVER, Observable } from "rxjs";
import { map as rxMap } from "rxjs/operators";

const FORUM_THREAD_NOT_FOUND: unique symbol = Symbol("FORUM_THREAD_NOT_FOUND");

@Component({
  selector: "etwin-forum-thread",
  templateUrl: "./forum-thread.component.html",
  styleUrls: [],
})
export class ForumThreadComponent implements OnInit {
  private readonly route: ActivatedRoute;

  public thread$: Observable<ForumThread | typeof FORUM_THREAD_NOT_FOUND>;
  public readonly FORUM_THREAD_NOT_FOUND = FORUM_THREAD_NOT_FOUND;

  constructor(
    route: ActivatedRoute,
  ) {
    this.route = route;
    this.thread$ = RX_NEVER;
  }

  ngOnInit(): void {
    interface RouteData {
      thread: ForumThread | null;
    }

    const routeData$: Observable<RouteData> = this.route.data as any;
    this.thread$ = routeData$.pipe(rxMap(({thread}: RouteData) => thread !== null ? thread : FORUM_THREAD_NOT_FOUND));
  }
}
