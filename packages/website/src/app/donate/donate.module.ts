import { NgModule } from "@angular/core";

import { SharedModule } from "../shared/shared.module";
import { DonateRoutingModule } from "./donate-routing.module";
import { DonateComponent } from "./donate.component";

@NgModule({
  declarations: [DonateComponent],
  imports: [
    DonateRoutingModule,
    SharedModule,
  ],
})
export class DonateModule {
}
