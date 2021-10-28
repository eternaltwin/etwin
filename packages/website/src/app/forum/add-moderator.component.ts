import { Component, Input, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ForumSection } from "@eternal-twin/core/forum/forum-section";
import { ForumSectionId } from "@eternal-twin/core/forum/forum-section-id";
import { UserId } from "@eternal-twin/core/user/user-id";
import { Subscription } from "rxjs";

import { ForumService } from "../../modules/forum/forum.service";

@Component({
  selector: "etwin-add-moderator",
  templateUrl: "./add-moderator.component.html",
  styleUrls: [],
})
export class AddModeratorComponent implements OnInit {
  @Input()
  public set sectionId(value: string | undefined) {
    this.sectionIdControl.setValue(value ?? "");
  }

  public get sectionId(): string | undefined {
    const value: string = this.sectionIdControl.value;
    return value === "" ? undefined : value;
  }

  private readonly forum: ForumService;
  private readonly router: Router;

  public readonly addModeratorForm: FormGroup;
  public readonly userId: FormControl;
  public readonly sectionIdControl: FormControl;

  public pendingSubscription: Subscription | null;
  public serverError: Error | null;

  constructor(
    route: ActivatedRoute,
    forum: ForumService,
    router: Router,
  ) {
    this.forum = forum;
    this.router = router;

    this.sectionIdControl = new FormControl(
      "",
      [Validators.required],
    );
    this.userId = new FormControl(
      "",
      [Validators.required],
    );
    this.addModeratorForm = new FormGroup({
      sectionId: this.sectionIdControl,
      userId: this.userId,
    });
    this.pendingSubscription = null;
    this.serverError = null;
  }

  ngOnInit(): void {
  }

  public onSubmit(event: Event) {
    event.preventDefault();
    if (this.pendingSubscription !== null) {
      return;
    }
    const model: any = this.addModeratorForm.getRawValue();
    const sectionId: ForumSectionId = model.sectionId;
    const userId: UserId = model.userId;
    const section$ = this.forum.addModerator(sectionId, userId);
    this.serverError = null;
    const subscription: Subscription = section$.subscribe({
      next: (section: ForumSection): void => {
        subscription.unsubscribe();
        this.pendingSubscription = null;
        this.router.navigate(["", "forum", "sections", section.id]);
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
