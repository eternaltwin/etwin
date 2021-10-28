import { Component, Input } from "@angular/core";
import { ObjectType } from "@eternal-twin/core/core/object-type";
import { ForumActor } from "@eternal-twin/core/forum/forum-actor";
import { UserForumActor } from "@eternal-twin/core/forum/user-forum-actor";

@Component({
  selector: "etwin-forum-actor",
  templateUrl: "./forum-actor.component.html",
  styleUrls: [],
})
export class ForumActorComponent {
  @Input()
  public actor!: ForumActor;

  public ObjectType: typeof ObjectType = ObjectType;

  constructor() {
  }

  public asUserForumActor(author: ForumActor): UserForumActor {
    return author as UserForumActor;
  }
}
