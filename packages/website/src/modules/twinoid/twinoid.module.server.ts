import { NgModule } from "@angular/core";

import { TwinoidService } from "./twinoid.service";
import { ServerTwinoidService } from "./twinoid.service.server";

@NgModule({
  providers: [
    {provide: TwinoidService, useClass: ServerTwinoidService},
  ],
  imports: [],
})
export class ServerTwinoidModule {
}
