import { NgModule } from "@angular/core";

import { SharedModule } from "../shared/shared.module";
import { DonateComponent } from "./donate.component";
import { DonateRoutingModule } from "./donate-routing.module";

@NgModule({
  declarations: [DonateComponent],
  imports: [
    DonateRoutingModule,
    SharedModule,
  ],
})
export class DonateModule {
}
