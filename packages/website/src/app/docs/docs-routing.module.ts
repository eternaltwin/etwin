import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { DocsViewComponent } from "./docs-view.component";

const routes: Routes = [
  {path: "**", component: DocsViewComponent, pathMatch: "full"},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DocsRoutingModule {
}
