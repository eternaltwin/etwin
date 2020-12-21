import { NgModule } from "@angular/core";

import { RestModule } from "../rest/rest.module";
import { TwinoidService } from "./twinoid.service";
import { BrowserTwinoidService } from "./twinoid.service.browser";

@NgModule({
  providers: [
    {provide: TwinoidService, useClass: BrowserTwinoidService},
  ],
  imports: [
    RestModule,
  ],
})
export class BrowserTwinoidModule {
}
