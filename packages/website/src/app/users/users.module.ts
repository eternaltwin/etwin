import { NgModule } from "@angular/core";

import { SharedModule } from "../shared/shared.module";
import { UsersRoutingModule } from "./users-routing.module";
import { UserViewComponent } from "./user-view.component";

@NgModule({
  declarations: [UserViewComponent],
  imports: [
    UsersRoutingModule,
    SharedModule,
  ],
})
export class UsersModule {
}
