import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { HomeView } from "./home/home.component";

const routes: Routes = [
  {path: "", component: HomeView, pathMatch: "full"},
  {path: "login", loadChildren: () => import("./auth/login/login.module").then(({LoginModule}) => LoginModule)},
  {
    path: "register",
    loadChildren: () => import("./auth/register/register.module").then(({RegisterModule}) => RegisterModule),
  },
  {path: "legal", loadChildren: () => import("./legal/legal.module").then(({LegalModule}) => LegalModule)},
  {path: "users", loadChildren: () => import("./users/users.module").then(({UsersModule}) => UsersModule)},
  {path: "forum", loadChildren: () => import("./forum/forum.module").then(({ForumModule}) => ForumModule)},
  {
    path: "settings",
    loadChildren: () => import("./settings/settings.module").then(({SettingsModule}) => SettingsModule),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {initialNavigation: "enabled"}),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
