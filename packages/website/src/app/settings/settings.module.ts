import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { SharedModule } from "../shared/shared.module";
import { LinkedDinoparcSettingsComponent } from "./linked-dinoparc-settings.component";
import { LinkedHammerfestSettingsComponent } from "./linked-hammerfest-settings.component";
import { LinkedTwinoidSettingsComponent } from "./linked-twinoid-settings.component";
import { LinkedUsersSettingsComponent } from "./linked-users-settings.component";
import { SettingsRoutingModule } from "./settings-routing.module";
import { SettingsViewComponent } from "./settings-view.component";

@NgModule({
  declarations: [
    LinkedDinoparcSettingsComponent,
    LinkedHammerfestSettingsComponent,
    LinkedUsersSettingsComponent,
    LinkedTwinoidSettingsComponent,
    SettingsViewComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SettingsRoutingModule,
    SharedModule,
  ],
})
export class SettingsModule {
}
