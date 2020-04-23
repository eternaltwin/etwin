import { NgModule } from "@angular/core";
import { ServerModule, ServerTransferStateModule } from "@angular/platform-server";

import { ServerAuthModule } from "../modules/auth/auth.module.server";
import { ServerUserModule } from "../modules/user/user.module.server";
import { AppComponent } from "./app.component";
import { AppModule } from "./app.module";

@NgModule({
  imports: [
    AppModule,
    ServerAuthModule,
    ServerModule,
    ServerTransferStateModule,
    ServerUserModule,
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {
}
