import { DOCUMENT } from "@angular/common";
import { Component, Inject, Input } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { TwinoidUserId } from "@eternal-twin/core/twinoid/twinoid-user-id";
import { UserId } from "@eternal-twin/core/user/user-id";
import { Subscription } from "rxjs";

import { UserService } from "../../modules/user/user.service";

@Component({
  selector: "etwin-unlink-twinoid-button",
  templateUrl: "./unlink-twinoid-button.component.html",
  styleUrls: [],
})
export class UnlinkTwinoidButtonComponent {
  @Input()
  public set userId(value: UserId | undefined) {
    this.userIdControl.setValue(value ?? "");
  }

  public get userId(): UserId | undefined {
    const value: UserId | "" = this.userIdControl.value;
    return value === "" ? undefined : value;
  }

  @Input()
  public set twinoidUserId(value: TwinoidUserId | undefined) {
    this.twinoidUserIdControl.setValue(value ?? "");
  }

  public get twinoidUserId(): TwinoidUserId | undefined {
    const value: TwinoidUserId | "" = this.twinoidUserIdControl.value;
    return value === "" ? undefined : value;
  }

  public readonly unlinkTwinoidForm: FormGroup;
  public readonly userIdControl: FormControl;
  public readonly twinoidUserIdControl: FormControl;
  public subscription: Subscription | null = null;
  public serverError: Error | null = null;

  private readonly document: Document;
  private readonly route: ActivatedRoute;
  private readonly user: UserService;

  constructor(
    route: ActivatedRoute,
    user: UserService,
    @Inject(DOCUMENT) document: Document,
  ) {
    this.document = document;
    this.route = route;
    this.user = user;

    this.userIdControl = new FormControl(
      "",
      [Validators.required],
    );
    this.twinoidUserIdControl = new FormControl(
      "",
      [Validators.required],
    );
    this.unlinkTwinoidForm = new FormGroup({
      userId: this.userIdControl,
      twinoidUserId: this.twinoidUserIdControl,
    });
  }

  ngOnInit(): void {}

  public onSubmitUnlinkTwinoid(event: Event) {
    event.preventDefault();
    if (this.subscription !== null) {
      return;
    }
    const model: any = this.unlinkTwinoidForm.getRawValue();
    const userId: UserId = model.userId;
    const twinoidUserId: TwinoidUserId = model.twinoidUserId;
    const updateResult$ = this.user.unlinkFromTwinoid({userId, twinoidUserId});
    this.serverError = null;
    const subscription: Subscription = updateResult$.subscribe({
      next: (): void => {
        subscription.unsubscribe();
        this.subscription = null;
        this.document.location.reload();
      },
      error: (err: Error): void => {
        subscription.unsubscribe();
        this.subscription = null;
        this.serverError = err;
      },
      complete: (): void => {
        subscription.unsubscribe();
        this.subscription = null;
      },
    });
    this.subscription = subscription;
  }
}
