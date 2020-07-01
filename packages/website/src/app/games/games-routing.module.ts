import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { GamesComponent } from "./games.component";

const routes: Routes = [
  {path: "", component: GamesComponent, pathMatch: "full"},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GamesRoutingModule {
}
