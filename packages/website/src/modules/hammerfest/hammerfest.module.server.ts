import { NgModule } from "@angular/core";

import { HammerfestService } from "./hammerfest.service";
import { ServerHammerfestService } from "./hammerfest.service.server";

@NgModule({
  providers: [
    {provide: HammerfestService, useClass: ServerHammerfestService},
  ],
  imports: [],
})
export class ServerHammerfestModule {
}
