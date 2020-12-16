import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { HomeView } from "./home/home.component";

const routes: Routes = [
  {path: "", component: HomeView, pathMatch: "full"},
  {path: "archive", loadChildren: () => import("./archive/archive.module").then(({ArchiveModule}) => ArchiveModule)},
  {path: "docs", loadChildren: () => import("./docs/docs.module").then(({DocsModule}) => DocsModule)},
  {path: "donate", loadChildren: () => import("./donate/donate.module").then(({DonateModule}) => DonateModule)},
  {path: "login", loadChildren: () => import("./auth/login/login.module").then(({LoginModule}) => LoginModule)},
  {
    path: "register",
    loadChildren: () => import("./auth/register/register.module").then(({RegisterModule}) => RegisterModule),
  },
  {path: "legal", loadChildren: () => import("./legal/legal.module").then(({LegalModule}) => LegalModule)},
  {path: "games", loadChildren: () => import("./games/games.module").then(({GamesModule}) => GamesModule)},
  {path: "users", loadChildren: () => import("./users/users.module").then(({UsersModule}) => UsersModule)},
  {path: "forum", loadChildren: () => import("./forum/forum.module").then(({ForumModule}) => ForumModule)},
  {
    path: "settings",
    loadChildren: () => import("./settings/settings.module").then(({SettingsModule}) => SettingsModule),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {initialNavigation: "enabled", onSameUrlNavigation: "reload"}),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
