import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ForumSectionListing } from "@eternal-twin/core/forum/forum-section-listing";
import { NEVER as RX_NEVER, Observable } from "rxjs";
import { map as rxMap } from "rxjs/operators";

@Component({
  selector: "etwin-forum-home",
  templateUrl: "./forum-home.component.html",
  styleUrls: [],
})
export class ForumHomeComponent implements OnInit {
  private readonly route: ActivatedRoute;

  public sections$: Observable<ForumSectionListing>;

  constructor(
    route: ActivatedRoute,
  ) {
    this.route = route;
    this.sections$ = RX_NEVER;
  }

  ngOnInit(): void {
    interface RouteData {
      sections: ForumSectionListing;
    }

    const routeData$: Observable<RouteData> = this.route.data as any;
    this.sections$ = routeData$.pipe(rxMap(({sections}: RouteData) => sections));
  }
}
