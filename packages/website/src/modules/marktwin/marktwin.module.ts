import { NgModule } from "@angular/core";

import { MarktwinService } from "./marktwin.service";
import { BrowserMarktwinService } from "./marktwin.service.browser";

@NgModule({
  providers: [
    {provide: MarktwinService, useClass: BrowserMarktwinService},
  ],
  imports: [],
})
export class MarktwinModule {
}
