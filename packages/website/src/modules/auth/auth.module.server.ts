import { NgModule } from "@angular/core";

import { AuthService } from "./auth.service";
import { ServerAuthService } from "./auth.service.server";

@NgModule({
  providers: [
    {provide: AuthService, useClass: ServerAuthService},
  ],
  imports: [],
})
export class ServerAuthModule {
}
