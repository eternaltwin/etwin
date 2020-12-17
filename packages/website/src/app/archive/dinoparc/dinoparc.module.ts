import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared/shared.module";
import { DinoparcHomeView } from "./dinoparc-home.view";
import { DinoparcRoutingModule } from "./dinoparc-routing.module";
import { DinoparcUserComponent } from "./dinoparc-user.component";
import { DinoparcUserView } from "./dinoparc-user.view";

@NgModule({
  declarations: [DinoparcHomeView, DinoparcUserComponent, DinoparcUserView],
  imports: [
    CommonModule,
    DinoparcRoutingModule,
    SharedModule,
  ],
})
export class DinoparcModule {
}
