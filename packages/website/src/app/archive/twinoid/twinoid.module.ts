import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared/shared.module";
import { TwinoidHomeView } from "./twinoid-home.view";
import { TwinoidRoutingModule } from "./twinoid-routing.module";
import { TwinoidUserComponent } from "./twinoid-user.component";
import { TwinoidUserView } from "./twinoid-user.view";

@NgModule({
  declarations: [TwinoidHomeView, TwinoidUserComponent, TwinoidUserView],
  imports: [
    CommonModule,
    TwinoidRoutingModule,
    SharedModule,
  ],
})
export class TwinoidModule {
}
