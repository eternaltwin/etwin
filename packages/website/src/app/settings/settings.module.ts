import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "../shared/shared.module";
import { LinkedHammerfestSettingsComponent } from "./linked-hammerfest-settings.component";
import { LinkedTwinoidSettingsComponent } from "./linked-twinoid-settings.component";
import { LinkedUsersSettingsComponent } from "./linked-users-settings.component";
import { SettingsRoutingModule } from "./settings-routing.module";
import { SettingsViewComponent } from "./settings-view.component";

@NgModule({
  declarations: [
    LinkedHammerfestSettingsComponent,
    LinkedUsersSettingsComponent,
    LinkedTwinoidSettingsComponent,
    SettingsViewComponent,
  ],
  imports: [
    CommonModule,
    SettingsRoutingModule,
    SharedModule,
  ],
})
export class SettingsModule {
}
