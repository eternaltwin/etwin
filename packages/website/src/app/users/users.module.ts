import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "../shared/shared.module";
import { LinkedUserComponent } from "./linked-user.component";
import { UserViewComponent } from "./user-view.component";
import { UsersRoutingModule } from "./users-routing.module";

@NgModule({
  declarations: [LinkedUserComponent, UserViewComponent],
  imports: [
    CommonModule,
    UsersRoutingModule,
    SharedModule,
  ],
})
export class UsersModule {
}
