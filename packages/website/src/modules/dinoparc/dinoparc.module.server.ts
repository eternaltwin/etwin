import { NgModule } from "@angular/core";

import { DinoparcService } from "./dinoparc.service";
import { ServerDinoparcService } from "./dinoparc.service.server";

@NgModule({
  providers: [
    {provide: DinoparcService, useClass: ServerDinoparcService},
  ],
  imports: [],
})
export class ServerDinoparcModule {
}
