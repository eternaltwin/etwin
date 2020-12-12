import { Component, Input } from "@angular/core";

@Component({
  selector: "etwin-docs-content",
  templateUrl: "./docs-content.component.html",
  styleUrls: [],
})
export class DocsContentComponent {
  @Input()
  public path?: string;

  public constructor() {
  }
}
