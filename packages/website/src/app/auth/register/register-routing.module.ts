import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { RegisterComponent } from "./register.component";
import { RegisterEmailComponent } from "./register-email.component";
import { RegisterUsernameComponent } from "./register-username.component";

const routes: Routes = [
  {path: "", component: RegisterComponent, pathMatch: "full"},
  {path: "email", component: RegisterEmailComponent, pathMatch: "full"},
  {path: "username", component: RegisterUsernameComponent, pathMatch: "full"},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegisterRoutingModule {
}
