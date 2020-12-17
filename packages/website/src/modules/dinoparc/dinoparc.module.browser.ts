import { NgModule } from "@angular/core";

import { RestModule } from "../rest/rest.module";
import { DinoparcService } from "./dinoparc.service";
import { BrowserDinoparcService } from "./dinoparc.service.browser";

@NgModule({
  providers: [
    {provide: DinoparcService, useClass: BrowserDinoparcService},
  ],
  imports: [
    RestModule,
  ],
})
export class BrowserDinoparcModule {
}
