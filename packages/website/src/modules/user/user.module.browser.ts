import { NgModule } from "@angular/core";

import { RestModule } from "../rest/rest.module";
import { UserService } from "./user.service";
import { BrowserUserService } from "./user.service.browser";

@NgModule({
  providers: [
    {provide: UserService, useClass: BrowserUserService},
  ],
  imports: [
    RestModule,
  ],
})
export class BrowserUserModule {
}
