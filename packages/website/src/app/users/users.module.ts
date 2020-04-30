import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { AppRoutingModule } from "../app-routing.module";
import { SharedModule } from "../shared/shared.module";
import { UserViewComponent } from "./user-view.component";
import { UsersRoutingModule } from "./users-routing.module";

@NgModule({
  declarations: [UserViewComponent],
  imports: [
    CommonModule,
    UsersRoutingModule,
    SharedModule,
  ],
})
export class UsersModule {
}
