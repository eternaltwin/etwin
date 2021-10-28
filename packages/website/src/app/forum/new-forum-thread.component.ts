import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { $MarktwinText, MarktwinText } from "@eternal-twin/core/core/marktwin-text";
import { ForumSection } from "@eternal-twin/core/forum/forum-section";
import { ForumSectionId } from "@eternal-twin/core/forum/forum-section-id";
import { ForumThread } from "@eternal-twin/core/forum/forum-thread";
import { $ForumThreadTitle, ForumThreadTitle } from "@eternal-twin/core/forum/forum-thread-title";
import { Grammar } from "@eternal-twin/marktwin/grammar";
import { NEVER as RX_NEVER, Observable, Subscription } from "rxjs";
import { map as rxMap } from "rxjs/operators";

import { ForumService } from "../../modules/forum/forum.service";
import { MarktwinService } from "../../modules/marktwin/marktwin.service";

const FORUM_SECTION_NOT_FOUND: unique symbol = Symbol("FORUM_SECTION_NOT_FOUND");

const DEFAULT_GRAMMAR: Grammar = {
  admin: false,
  depth: 4,
  emphasis: true,
  icons: [],
  links: ["http", "https"],
  mod: false,
  quote: false,
  spoiler: true,
  strikethrough: true,
  strong: true,
};

@Component({
  selector: "etwin-new-forum-thread",
  templateUrl: "./new-forum-thread.component.html",
  styleUrls: [],
})
export class NewForumThreadComponent implements OnInit {
  readonly #route: ActivatedRoute;
  readonly #forum: ForumService;
  readonly #marktwin: MarktwinService;
  readonly #router: Router;

  public section$: Observable<ForumSection | typeof FORUM_SECTION_NOT_FOUND>;
  public readonly FORUM_SECTION_NOT_FOUND = FORUM_SECTION_NOT_FOUND;
  public readonly $ForumThreadTitle = $ForumThreadTitle;

  public readonly newThreadForm: FormGroup;
  public readonly title: FormControl;
  public readonly body: FormControl;
  public readonly sectionId: FormControl;

  public pendingSubscription: Subscription | null;
  public serverError: Error | null;
  public preview: string | null;
  public extendedEditor: boolean;

  constructor(
    route: ActivatedRoute,
    forum: ForumService,
    marktwin: MarktwinService,
    router: Router,
  ) {
    this.#route = route;
    this.section$ = RX_NEVER;
    this.#forum = forum;
    this.#marktwin = marktwin;
    this.#router = router;

    this.title = new FormControl(
      "",
      [Validators.required, Validators.minLength($ForumThreadTitle.minLength ?? 0), Validators.maxLength($ForumThreadTitle.maxLength)],
    );
    this.body = new FormControl(
      "",
      [Validators.required, Validators.minLength($MarktwinText.minLength ?? 0), Validators.maxLength($MarktwinText.maxLength)],
    );
    this.sectionId = new FormControl(
      "",
      [Validators.required],
    );
    this.newThreadForm = new FormGroup({
      title: this.title,
      body: this.body,
      sectionId: this.sectionId,
    });
    this.pendingSubscription = null;
    this.serverError = null;
    this.extendedEditor = false;
    this.preview = null;
  }

  ngOnInit(): void {
    interface RouteData {
      section: ForumSection | null;
    }

    const routeData$: Observable<RouteData> = this.#route.data as any;
    this.section$ = routeData$.pipe(rxMap(({section}: RouteData): ForumSection | typeof FORUM_SECTION_NOT_FOUND => {
      if (section !== null) {
        this.sectionId.setValue(section.id);
        return section;
      } else {
        return FORUM_SECTION_NOT_FOUND;
      }
    }));
  }

  public toggleEmphasis(textArea: HTMLTextAreaElement) {
    const text: string = this.body.value;
    const start: number = textArea.selectionStart ?? 0;
    const end: number = textArea.selectionEnd ?? 0;

    const updated = this.#marktwin.toggleEmphasis(DEFAULT_GRAMMAR, text, {start, end});

    this.body.setValue(updated.text);
    textArea.selectionStart = updated.range.start;
    textArea.selectionEnd = updated.range.end;

    textArea.focus();
  }

  public toggleStrong(textArea: HTMLTextAreaElement) {
    const text: string = this.body.value;
    const start: number = textArea.selectionStart ?? 0;
    const end: number = textArea.selectionEnd ?? 0;

    const updated = this.#marktwin.toggleStrong(DEFAULT_GRAMMAR, text, {start, end});

    this.body.setValue(updated.text);
    textArea.selectionStart = updated.range.start;
    textArea.selectionEnd = updated.range.end;

    textArea.focus();
  }

  public toggleStrikethrough(textArea: HTMLTextAreaElement) {
    const text: string = this.body.value;
    const start: number = textArea.selectionStart ?? 0;
    const end: number = textArea.selectionEnd ?? 0;

    const updated = this.#marktwin.toggleStrikethrough(DEFAULT_GRAMMAR, text, {start, end});

    this.body.setValue(updated.text);
    textArea.selectionStart = updated.range.start;
    textArea.selectionEnd = updated.range.end;

    textArea.focus();
  }

  public togglePreview() {
    if (this.preview === null) {
      this.preview = this.#marktwin.renderMarktwin(DEFAULT_GRAMMAR, this.body.value);
    } else {
      this.preview = null;
    }
  }

  public onSubmit(event: Event) {
    event.preventDefault();
    if (this.pendingSubscription !== null) {
      return;
    }
    const model: any = this.newThreadForm.getRawValue();
    const title: ForumThreadTitle = model.title;
    const body: MarktwinText = model.body;
    const sectionId: ForumSectionId = model.sectionId;
    const thread$ = this.#forum.createThread(sectionId, {title, body});
    this.serverError = null;
    const subscription: Subscription = thread$.subscribe({
      next: (thread: ForumThread): void => {
        subscription.unsubscribe();
        this.pendingSubscription = null;
        this.#router.navigate(["", "forum", "threads", thread.id]);
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
