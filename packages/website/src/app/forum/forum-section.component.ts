import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ForumSection } from "@eternal-twin/core/lib/forum/forum-section";
import { NEVER as RX_NEVER, Observable } from "rxjs";
import { map as rxMap } from "rxjs/operators";

const FORUM_SECTION_NOT_FOUND: unique symbol = Symbol("FORUM_SECTION_NOT_FOUND");

@Component({
  selector: "etwin-forum-section",
  templateUrl: "./forum-section.component.html",
  styleUrls: [],
})
export class ForumSectionComponent implements OnInit {
  private readonly route: ActivatedRoute;

  public section$: Observable<ForumSection | typeof FORUM_SECTION_NOT_FOUND>;
  public readonly FORUM_SECTION_NOT_FOUND = FORUM_SECTION_NOT_FOUND;

  constructor(
    route: ActivatedRoute,
  ) {
    this.route = route;
    this.section$ = RX_NEVER;
  }

  ngOnInit(): void {
    interface RouteData {
      section: ForumSection | null;
    }

    const routeData$: Observable<RouteData> = this.route.data as any;
    this.section$ = routeData$.pipe(rxMap(({section}: RouteData) => section !== null ? section : FORUM_SECTION_NOT_FOUND));
  }
}
