import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { $MarktwinText, MarktwinText } from "@eternal-twin/core/core/marktwin-text";
import { ForumPost } from "@eternal-twin/core/forum/forum-post";
import { ForumSectionId } from "@eternal-twin/core/forum/forum-section-id";
import { ForumThread } from "@eternal-twin/core/forum/forum-thread";
import { $ForumThreadTitle, ForumThreadTitle } from "@eternal-twin/core/forum/forum-thread-title";
import { NEVER as RX_NEVER, Observable, Subscription } from "rxjs";
import { map as rxMap } from "rxjs/operators";

import { ForumService } from "../../modules/forum/forum.service";

const FORUM_THREAD_NOT_FOUND: unique symbol = Symbol("FORUM_THREAD_NOT_FOUND");

@Component({
  selector: "etwin-new-forum-post",
  templateUrl: "./new-forum-post.component.html",
  styleUrls: [],
})
export class NewForumPostComponent implements OnInit {
  private readonly route: ActivatedRoute;
  private readonly forum: ForumService;
  private readonly router: Router;

  public thread$: Observable<ForumThread | typeof FORUM_THREAD_NOT_FOUND>;
  public readonly FORUM_THREAD_NOT_FOUND = FORUM_THREAD_NOT_FOUND;

  public readonly newPostForm: FormGroup;
  public readonly body: FormControl;
  public readonly threadId: FormControl;

  public pendingSubscription: Subscription | null;
  public serverError: Error | null;

  constructor(
    route: ActivatedRoute,
    forum: ForumService,
    router: Router,
  ) {
    this.route = route;
    this.thread$ = RX_NEVER;
    this.forum = forum;
    this.router = router;

    this.body = new FormControl(
      "",
      [Validators.required, Validators.minLength($MarktwinText.minLength ?? 0), Validators.maxLength($MarktwinText.maxLength)],
    );
    this.threadId = new FormControl(
      "",
      [Validators.required],
    );
    this.newPostForm = new FormGroup({
      body: this.body,
      threadId: this.threadId,
    });
    this.pendingSubscription = null;
    this.serverError = null;
  }

  ngOnInit(): void {
    interface RouteData {
      thread: ForumThread | null;
    }

    const routeData$: Observable<RouteData> = this.route.data as any;
    this.thread$ = routeData$.pipe(rxMap(({thread}: RouteData): ForumThread | typeof FORUM_THREAD_NOT_FOUND => {
      if (thread !== null) {
        this.threadId.setValue(thread.id);
        return thread;
      } else {
        return FORUM_THREAD_NOT_FOUND;
      }
    }));
  }

  public onSubmit(event: Event) {
    event.preventDefault();
    if (this.pendingSubscription !== null) {
      return;
    }
    const model: any = this.newPostForm.getRawValue();
    const title: ForumThreadTitle = model.title;
    const body: MarktwinText = model.body;
    const threadId: ForumSectionId = model.threadId;
    const post$ = this.forum.createPost(threadId, {body});
    this.serverError = null;
    const subscription: Subscription = post$.subscribe({
      next: (post: ForumPost): void => {
        subscription.unsubscribe();
        this.pendingSubscription = null;
        this.router.navigate(["", "forum", "threads", threadId]);
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
