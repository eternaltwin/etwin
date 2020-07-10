import { Component, Input } from "@angular/core";
import { ShortForumPost } from "@eternal-twin/core/lib/forum/short-forum-post";

@Component({
  selector: "etwin-forum-post",
  templateUrl: "./short-forum-post.component.html",
  styleUrls: [],
})
export class ShortForumPostComponent {
  @Input()
  public post!: ShortForumPost;

  @Input()
  public canEdit: boolean = false;

  constructor() {
  }
}
