import { NgModule } from "@angular/core";

import { UserService } from "./user.service";
import { ServerUserService } from "./user.service.server";

@NgModule({
  providers: [
    {provide: UserService, useClass: ServerUserService},
  ],
  imports: [],
})
export class ServerUserModule {
}
