import { NgModule } from "@angular/core";

import { MarktwinService } from "./marktwin.service";
import { ServerMarktwinService } from "./marktwin.service.server";

@NgModule({
  providers: [
    {provide: MarktwinService, useClass: ServerMarktwinService},
  ],
  imports: [],
})
export class MarktwinModule {
}
