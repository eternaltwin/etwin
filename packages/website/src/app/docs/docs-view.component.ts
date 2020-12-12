import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, UrlSegment } from "@angular/router";
import { Observable } from "rxjs";
import { map as rxMap } from "rxjs/operators";

@Component({
  selector: "etwin-docs-view",
  templateUrl: "./docs-view.component.html",
  styleUrls: [],
})
export class DocsViewComponent implements OnInit {
  private readonly route: ActivatedRoute;
  public url$: Observable<string> | null;

  public constructor(route: ActivatedRoute) {
    this.route = route;
    this.url$ = null;
  }

  ngOnInit(): void {
    this.url$ = this.route.url.pipe(
      rxMap((segments: readonly UrlSegment[]): string => {
        return segments.map(s => s.path).join("/");
      })
    );
  }
}
