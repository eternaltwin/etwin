import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { SharedModule } from "../shared/shared.module";
import { ForumHomeComponent } from "./forum-home.component";
import { ForumRoutingModule } from "./forum-routing.module";
import { ForumSectionComponent } from "./forum-section.component";
import { ForumThreadComponent } from "./forum-thread.component";
import { NewForumPostComponent } from "./new-forum-post.component";
import { NewForumThreadComponent } from "./new-forum-thread.component";

@NgModule({
  declarations: [ForumHomeComponent, ForumThreadComponent, ForumSectionComponent, NewForumPostComponent, NewForumThreadComponent],
  imports: [
    CommonModule,
    FormsModule,
    ForumRoutingModule,
    ReactiveFormsModule,
    SharedModule,
  ],
})
export class ForumModule {
}
