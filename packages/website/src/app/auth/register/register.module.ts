import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "../../shared/shared.module";
import { RegisterEmailComponent } from "./register-email.component";
import { RegisterRoutingModule } from "./register-routing.module";
import { RegisterUsernameComponent } from "./register-username.component";
import { RegisterComponent } from "./register.component";

@NgModule({
  declarations: [RegisterComponent, RegisterEmailComponent, RegisterUsernameComponent],
  imports: [
    CommonModule,
    RegisterRoutingModule,
    SharedModule,
  ],
})
export class RegisterModule {
}
