import { Component, Input } from "@angular/core";

@Component({
  selector: "etwin-pagination",
  templateUrl: "./pagination.component.html",
  styleUrls: [],
})
export class PaginationComponent {
  @Input()
  public link: any[] | string | null | undefined;

  /**
   * Total number of pages
   */
  @Input()
  public pageCount: number;

  /**
   * Current page 1-based index.
   */
  @Input()
  public page1: number;

  /**
   * Page query parameter.
   */
  @Input()
  public param: string = "p";

  constructor() {
    this.pageCount = 1;
    this.page1 = 1;
  }

  public getParams(page1: number) {
    return {[this.param]: page1};
  }
}
