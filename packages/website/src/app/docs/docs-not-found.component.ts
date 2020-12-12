import { Component, Input } from "@angular/core";

@Component({
  selector: "etwin-docs-not-found",
  template: "<h1>Documentation not found</h1><p>No documentation found for the path <strong>{{path}}</strong>.</p>",
  styleUrls: [],
})
export class DocsNotFoundComponent {
  @Input()
  public path?: string;

  public constructor() {
  }
}
