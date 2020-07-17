import { NgModule } from "@angular/core";

import { ConfigService } from "./config.service";
import { BrowserConfigService } from "./config.service.browser";

@NgModule({
  providers: [
    {provide: ConfigService, useClass: BrowserConfigService},
  ],
  imports: [],
})
export class BrowserConfigModule {
}
