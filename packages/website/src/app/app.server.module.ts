import { NgModule } from "@angular/core";
import { ServerModule, ServerTransferStateModule } from "@angular/platform-server";

import { ServerAuthModule } from "../modules/auth/auth.module.server";
import { ServerConfigModule } from "../modules/config/config.module.server";
import { ServerDinoparcModule } from "../modules/dinoparc/dinoparc.module.server";
import { ServerForumModule } from "../modules/forum/forum.module.server";
import { ServerHammerfestModule } from "../modules/hammerfest/hammerfest.module.server";
import { ServerTwinoidModule } from "../modules/twinoid/twinoid.module.server";
import { ServerUserModule } from "../modules/user/user.module.server";
import { AppComponent } from "./app.component";
import { AppModule } from "./app.module";

@NgModule({
  imports: [
    AppModule,
    ServerAuthModule,
    ServerConfigModule,
    ServerDinoparcModule,
    ServerForumModule,
    ServerHammerfestModule,
    ServerModule,
    ServerTransferStateModule,
    ServerTwinoidModule,
    ServerUserModule,
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {
}
