import { NgModule } from "@angular/core";

import { RestModule } from "../rest/rest.module";
import { HammerfestService } from "./hammerfest.service";
import { BrowserHammerfestService } from "./hammerfest.service.browser";

@NgModule({
  providers: [
    {provide: HammerfestService, useClass: BrowserHammerfestService},
  ],
  imports: [
    RestModule,
  ],
})
export class BrowserHammerfestModule {
}
