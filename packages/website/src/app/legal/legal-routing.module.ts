import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { LegalViewComponent } from "./legal-view.component";

const routes: Routes = [
  {path: "", component: LegalViewComponent, pathMatch: "full"},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LegalRoutingModule {
}
