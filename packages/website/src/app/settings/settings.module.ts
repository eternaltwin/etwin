import { NgModule } from "@angular/core";

import { SharedModule } from "../shared/shared.module";
import { SettingsRoutingModule } from "./settings-routing.module";
import { SettingsViewComponent } from "./settings-view.component";

@NgModule({
  declarations: [SettingsViewComponent],
  imports: [
    SettingsRoutingModule,
    SharedModule,
  ],
})
export class SettingsModule {
}
