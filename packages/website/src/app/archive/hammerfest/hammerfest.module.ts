import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared/shared.module";
import { HammerfestHomeView } from "./hammerfest-home.view";
import { HammerfestRoutingModule } from "./hammerfest-routing.module";
import { HammerfestUserComponent } from "./hammerfest-user.component";
import { HammerfestUserView } from "./hammerfest-user.view";

@NgModule({
  declarations: [HammerfestHomeView, HammerfestUserComponent, HammerfestUserView],
  imports: [
    CommonModule,
    HammerfestRoutingModule,
    SharedModule,
  ],
})
export class HammerfestModule {
}
