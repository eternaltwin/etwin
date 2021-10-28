import { DOCUMENT } from "@angular/common";
import { Component, Inject, Input } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { HammerfestServer } from "@eternal-twin/core/hammerfest/hammerfest-server";
import { HammerfestUserId } from "@eternal-twin/core/hammerfest/hammerfest-user-id";
import { UserId } from "@eternal-twin/core/user/user-id";
import { Subscription } from "rxjs";

import { UserService } from "../../modules/user/user.service";

@Component({
  selector: "etwin-unlink-hammerfest-button",
  templateUrl: "./unlink-hammerfest-button.component.html",
  styleUrls: [],
})
export class UnlinkHammerfestButtonComponent {
  @Input()
  public set userId(value: UserId | undefined) {
    this.userIdControl.setValue(value ?? "");
  }

  public get userId(): UserId | undefined {
    const value: UserId | "" = this.userIdControl.value;
    return value === "" ? undefined : value;
  }

  @Input()
  public set hammerfestServer(value: HammerfestServer | undefined) {
    this.hammerfestServerControl.setValue(value ?? "");
  }

  public get hammerfestServer(): HammerfestServer | undefined {
    const value: HammerfestServer | "" = this.hammerfestServerControl.value;
    return value === "" ? undefined : value;
  }

  @Input()
  public set hammerfestUserId(value: HammerfestUserId | undefined) {
    this.hammerfestUserIdControl.setValue(value ?? "");
  }

  public get hammerfestUserId(): HammerfestUserId | undefined {
    const value: HammerfestUserId | "" = this.hammerfestUserIdControl.value;
    return value === "" ? undefined : value;
  }

  public readonly unlinkHammerfestForm: FormGroup;
  public readonly userIdControl: FormControl;
  public readonly hammerfestServerControl: FormControl;
  public readonly hammerfestUserIdControl: FormControl;
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
    this.hammerfestServerControl = new FormControl(
      "",
      [Validators.required],
    );
    this.hammerfestUserIdControl = new FormControl(
      "",
      [Validators.required],
    );
    this.unlinkHammerfestForm = new FormGroup({
      userId: this.userIdControl,
      hammerfestServer: this.hammerfestServerControl,
      hammerfestUserId: this.hammerfestUserIdControl,
    });
  }

  ngOnInit(): void {}

  public onSubmitUnlinkHammerfest(event: Event) {
    event.preventDefault();
    if (this.subscription !== null) {
      return;
    }
    const model: any = this.unlinkHammerfestForm.getRawValue();
    const userId: UserId = model.userId;
    const hammerfestServer: HammerfestServer = model.hammerfestServer;
    const hammerfestUserId: HammerfestUserId = model.hammerfestUserId;
    const updateResult$ = this.user.unlinkFromHammerfest({userId, hammerfestServer, hammerfestUserId});
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
