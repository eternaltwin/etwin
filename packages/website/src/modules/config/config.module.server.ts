import { NgModule } from "@angular/core";

import { ConfigService } from "./config.service";
import { ServerConfigService } from "./config.service.server";

@NgModule({
  providers: [
    {provide: ConfigService, useClass: ServerConfigService},
  ],
  imports: [],
})
export class ServerConfigModule {
}
