import { Component } from "@angular/core";
import { Event, Router, UrlTree } from "@angular/router";
import { LocaleId } from "@eternal-twin/core/lib/core/locale-id";
import { Observable } from "rxjs";
import { distinctUntilChanged as rxDistinctUntilChanged, map as rxMap, startWith as rxStartWith } from "rxjs/operators";

@Component({
  selector: "etwin-language-picker",
  templateUrl: "./language-picker.component.html",
  styleUrls: [],
})
export class LanguagePickerComponent {
  private readonly router: Router;

  constructor(router: Router) {
    this.router = router;
  }

  getUrl(localeId: LocaleId): Observable<string> {
    const currentUrl$: Observable<string> = this.router.events.pipe(
      rxMap((ev: Event): string => this.router.url),
      rxStartWith(this.router.url),
      rxDistinctUntilChanged(),
    );
    return currentUrl$.pipe(rxMap((baseUrl: string): string => {
      const parsed: UrlTree = this.router.parseUrl(baseUrl);
      parsed.queryParams["l"] = localeId;
      return this.router.serializeUrl(parsed);
    }));
  }
}
