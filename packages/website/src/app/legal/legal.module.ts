import { NgModule } from "@angular/core";

import { SharedModule } from "../shared/shared.module";
import { LegalRoutingModule } from "./legal-routing.module";
import { LegalViewComponent } from "./legal-view.component";

@NgModule({
  declarations: [LegalViewComponent],
  imports: [
    LegalRoutingModule,
    SharedModule,
  ],
})
export class LegalModule {
}
