import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { SharedModule } from "../shared/shared.module";
import { AddModeratorComponent } from "./add-moderator.component";
import { DeleteModeratorComponent } from "./delete-moderator.component";
import { ForumActorComponent } from "./forum-actor.component";
import { ForumHomeComponent } from "./forum-home.component";
import { ForumPostComponent } from "./forum-post.component";
import { ForumRoutingModule } from "./forum-routing.module";
import { ForumSectionComponent } from "./forum-section.component";
import { ForumThreadComponent } from "./forum-thread.component";
import { NewForumPostComponent } from "./new-forum-post.component";
import { NewForumThreadComponent } from "./new-forum-thread.component";
import { UserInputComponent } from "./user-input.component";

@NgModule({
  declarations: [
    AddModeratorComponent,
    DeleteModeratorComponent,
    ForumActorComponent,
    ForumHomeComponent,
    ForumPostComponent,
    ForumThreadComponent,
    ForumSectionComponent,
    NewForumPostComponent,
    NewForumThreadComponent,
    UserInputComponent,
  ],
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
