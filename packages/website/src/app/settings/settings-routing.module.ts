import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { SettingsViewComponent } from "./settings-view.component";

const routes: Routes = [
  {path: "", component: SettingsViewComponent, pathMatch: "full"},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {
}
