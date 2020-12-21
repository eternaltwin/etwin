import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { ArchiveHomeView } from "./archive-home.view";

const routes: Routes = [
  {path: "", component: ArchiveHomeView, pathMatch: "full"},
  {path: "dinoparc", loadChildren: () => import("./dinoparc/dinoparc.module").then(({DinoparcModule}) => DinoparcModule)},
  {path: "hammerfest", loadChildren: () => import("./hammerfest/hammerfest.module").then(({HammerfestModule}) => HammerfestModule)},
  {path: "twinoid", loadChildren: () => import("./twinoid/twinoid.module").then(({TwinoidModule}) => TwinoidModule)},
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule],
})
export class ArchiveRoutingModule {
}
