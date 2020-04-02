import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HomeView } from "./home/home.component";

const routes: Routes = [
  {path: "", component: HomeView, pathMatch: "full"},
  {path: "login", loadChildren: () => import("./login/login.module").then(({LoginModule}) => LoginModule)},
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {initialNavigation: "enabled"}),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
