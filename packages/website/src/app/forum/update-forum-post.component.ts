import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { $MarktwinText, MarktwinText } from "@eternal-twin/core/core/marktwin-text";
import { ForumPost } from "@eternal-twin/core/forum/forum-post";
import { ForumPostRevision } from "@eternal-twin/core/forum/forum-post-revision";
import { NullableForumPostRevisionComment } from "@eternal-twin/core/forum/forum-post-revision-comment";
import { ForumPostRevisionId } from "@eternal-twin/core/forum/forum-post-revision-id";
import { UpdatePostOptions } from "@eternal-twin/core/forum/update-post-options";
import { NEVER as RX_NEVER, Observable, Subscription } from "rxjs";
import { map as rxMap } from "rxjs/operators";

import { ForumService } from "../../modules/forum/forum.service";

const FORUM_POST_NOT_FOUND: unique symbol = Symbol("FORUM_POST_NOT_FOUND");

@Component({
  selector: "etwin-new-forum-post",
  templateUrl: "./update-forum-post.component.html",
  styleUrls: [],
})
export class UpdateForumPostComponent implements OnInit {
  private readonly route: ActivatedRoute;
  private readonly forum: ForumService;
  private readonly router: Router;

  public post$: Observable<ForumPost | typeof FORUM_POST_NOT_FOUND>;
  public readonly FORUM_POST_NOT_FOUND = FORUM_POST_NOT_FOUND;

  public readonly updatePostForm: FormGroup;
  public readonly postId: FormControl;
  public readonly lastRevisionId: FormControl;
  public readonly hidePostContent: FormControl;
  public readonly moderation: FormControl;
  public readonly comment: FormControl;

  public pendingSubscription: Subscription | null;
  public serverError: Error | null;

  constructor(
    route: ActivatedRoute,
    forum: ForumService,
    router: Router,
  ) {
    this.route = route;
    this.post$ = RX_NEVER;
    this.forum = forum;
    this.router = router;
    this.postId = new FormControl(
      "",
      [Validators.required],
    );
    this.lastRevisionId = new FormControl(
      "",
      [Validators.required],
    );
    this.hidePostContent = new FormControl(
      false,
      [],
    );
    this.moderation = new FormControl(
      "",
      [Validators.minLength($MarktwinText.minLength ?? 0), Validators.maxLength($MarktwinText.maxLength)],
    );
    this.comment = new FormControl(
      "",
      [],
    );
    this.updatePostForm = new FormGroup({
      postId: this.postId,
      lastRevisionId: this.lastRevisionId,
      hidePostContent: this.hidePostContent,
      moderation: this.moderation,
      comment: this.comment,
    });
    this.pendingSubscription = null;
    this.serverError = null;
  }

  ngOnInit(): void {
    interface RouteData {
      post: ForumPost | null;
    }

    const routeData$: Observable<RouteData> = this.route.data as any;
    this.post$ = routeData$.pipe(rxMap(({post}: RouteData): ForumPost | typeof FORUM_POST_NOT_FOUND => {
      if (post !== null) {
        const lastRevision: ForumPostRevision = post.revisions.items[post.revisions.items.length - 1];
        if (lastRevision.content === null) {
          this.hidePostContent.setValue(true);
          this.hidePostContent.disable();
        }
        if (lastRevision.moderation !== null) {
          this.moderation.setValue(lastRevision.moderation.marktwin);
        }
        this.postId.setValue(post.id);
        this.lastRevisionId.setValue(lastRevision.id);
        return post;
      } else {
        return FORUM_POST_NOT_FOUND;
      }
    }));
  }

  public onSubmit(event: Event, post: ForumPost) {
    event.preventDefault();
    if (this.pendingSubscription !== null) {
      return;
    }
    const model: any = this.updatePostForm.getRawValue();
    // console.log(model);
    const lastRevisionId: ForumPostRevisionId = model.lastRevisionId;
    const hidePostContent: boolean = model.hidePostContent;
    const comment: NullableForumPostRevisionComment = model.comment;
    const moderation: MarktwinText = model.moderation;

    const update: UpdatePostOptions = {
      lastRevisionId,
      comment,
    };
    if (hidePostContent) {
      update.content = null;
    }
    update.moderation = moderation === "" ? null : moderation;

    const post$ = this.forum.updatePost(post.id, update);
    this.serverError = null;
    const subscription: Subscription = post$.subscribe({
      next: (post: ForumPost): void => {
        subscription.unsubscribe();
        this.pendingSubscription = null;
        this.router.navigate(["", "forum", "threads", post.thread.id]);
      },
      error: (err: Error): void => {
        subscription.unsubscribe();
        this.pendingSubscription = null;
        this.serverError = err;
      },
      complete: (): void => {
        subscription.unsubscribe();
        this.pendingSubscription = null;
      },
    });
    this.pendingSubscription = subscription;
  }
}
