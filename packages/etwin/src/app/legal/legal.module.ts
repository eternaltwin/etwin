import { NgModule } from "@angular/core";

import { LegalRoutingModule } from "./legal-routing.module";
import { LegalViewComponent } from "./legal-view.component";

@NgModule({
  declarations: [LegalViewComponent],
  imports: [
    LegalRoutingModule,
  ],
})
export class LegalModule {
}
