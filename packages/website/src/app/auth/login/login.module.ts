import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { SharedModule } from "../../shared/shared.module";
import { LoginComponent } from "./login.component";
import { LoginEtwinComponent } from "./login-etwin.component";
import { LoginHammerfestComponent } from "./login-hammerfest.component";
import { LoginRoutingModule } from "./login-routing.module";
import { LoginTwinoidComponent } from "./login-twinoid.component";

@NgModule({
  declarations: [
    LoginComponent,
    LoginEtwinComponent,
    LoginHammerfestComponent,
    LoginTwinoidComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LoginRoutingModule,
    SharedModule,
  ],
})
export class LoginModule {
}
