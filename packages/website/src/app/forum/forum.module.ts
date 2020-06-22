import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "../shared/shared.module";
import { ForumHomeComponent } from "./forum-home.component";
import { ForumRoutingModule } from "./forum-routing.module";
import { ForumSectionComponent } from "./forum-section.component";
import { ForumThreadComponent } from "./forum-thread.component";

@NgModule({
  declarations: [ForumHomeComponent, ForumThreadComponent, ForumSectionComponent],
  imports: [
    CommonModule,
    ForumRoutingModule,
    SharedModule,
  ],
})
export class ForumModule {
}
