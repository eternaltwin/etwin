import { NgModule } from "@angular/core";

import { RestModule } from "../rest/rest.module";
import { AuthService } from "./auth.service";
import { BrowserAuthService } from "./auth.service.browser";

@NgModule({
  providers: [
    {provide: AuthService, useClass: BrowserAuthService},
  ],
  imports: [
    RestModule,
  ],
})
export class BrowserAuthModule {
}
