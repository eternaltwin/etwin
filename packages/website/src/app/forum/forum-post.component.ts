import { Component, Input } from "@angular/core";
import { ForumPost } from "@eternal-twin/core/lib/forum/forum-post";

@Component({
  selector: "etwin-forum-post",
  templateUrl: "./forum-post.component.html",
  styleUrls: [],
})
export class ForumPostComponent {
  @Input()
  public post!: ForumPost;

  constructor() {
  }
}
