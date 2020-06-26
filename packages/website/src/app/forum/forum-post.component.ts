import { Component, Input } from "@angular/core";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type";
import { ForumPost } from "@eternal-twin/core/lib/forum/forum-post";
import { ForumPostAuthor } from "@eternal-twin/core/lib/forum/forum-post-author";
import { UserRef } from "@eternal-twin/core/lib/user/user-ref";

const FORUM_SECTION_NOT_FOUND: unique symbol = Symbol("FORUM_SECTION_NOT_FOUND");

@Component({
  selector: "etwin-forum-post",
  templateUrl: "./forum-post.component.html",
  styleUrls: [],
})
export class ForumPostComponent {
  @Input()
  public post!: ForumPost;

  public ObjectType: typeof ObjectType = ObjectType;

  constructor() {
  }

  public asUserRef(author: ForumPostAuthor): UserRef {
    return author as UserRef;
  }
}
