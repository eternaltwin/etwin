import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "../shared/shared.module";
import { DocsContentComponent } from "./docs-content.component";
import { DocsNotFoundComponent } from "./docs-not-found.component";
import { DocsRoutingModule } from "./docs-routing.module";
import { DocsViewComponent } from "./docs-view.component";

@NgModule({
  declarations: [DocsContentComponent, DocsNotFoundComponent, DocsViewComponent],
  imports: [
    CommonModule,
    DocsRoutingModule,
    SharedModule,
  ],
})
export class DocsModule {
}
