import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { MarktwinModule } from "../../modules/marktwin/marktwin.module";
import { SharedModule } from "../shared/shared.module";
import { AddModeratorComponent } from "./add-moderator.component";
import { DeleteModeratorComponent } from "./delete-moderator.component";
import { ForumActorComponent } from "./forum-actor.component";
import { ForumHomeComponent } from "./forum-home.component";
import { ForumRoutingModule } from "./forum-routing.module";
import { ForumSectionComponent } from "./forum-section.component";
import { ForumThreadComponent } from "./forum-thread.component";
import { NewForumPostComponent } from "./new-forum-post.component";
import { NewForumThreadComponent } from "./new-forum-thread.component";
import { ShortForumPostComponent } from "./short-forum-post.component";
import { UpdateForumPostComponent } from "./update-forum-post.component";
import { UserInputComponent } from "./user-input.component";

@NgModule({
  declarations: [
    AddModeratorComponent,
    DeleteModeratorComponent,
    ForumActorComponent,
    ForumHomeComponent,
    ForumThreadComponent,
    ForumSectionComponent,
    NewForumPostComponent,
    NewForumThreadComponent,
    ShortForumPostComponent,
    UpdateForumPostComponent,
    UserInputComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ForumRoutingModule,
    MarktwinModule,
    ReactiveFormsModule,
    SharedModule,
  ],
})
export class ForumModule {
}
