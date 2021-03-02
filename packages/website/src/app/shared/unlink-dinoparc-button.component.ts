import { DOCUMENT } from "@angular/common";
import { Component, Inject, Input } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { DinoparcServer } from "@eternal-twin/core/lib/dinoparc/dinoparc-server";
import { DinoparcUserId } from "@eternal-twin/core/lib/dinoparc/dinoparc-user-id";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { Subscription } from "rxjs";

import { UserService } from "../../modules/user/user.service";

@Component({
  selector: "etwin-unlink-dinoparc-button",
  templateUrl: "./unlink-dinoparc-button.component.html",
  styleUrls: [],
})
export class UnlinkDinoparcButtonComponent {
  @Input()
  public set userId(value: UserId | undefined) {
    this.userIdControl.setValue(value ?? "");
  }

  public get userId(): UserId | undefined {
    const value: UserId | "" = this.userIdControl.value;
    return value === "" ? undefined : value;
  }

  @Input()
  public set dinoparcServer(value: DinoparcServer | undefined) {
    this.dinoparcServerControl.setValue(value ?? "");
  }

  public get dinoparcServer(): DinoparcServer | undefined {
    const value: DinoparcServer | "" = this.dinoparcServerControl.value;
    return value === "" ? undefined : value;
  }

  @Input()
  public set dinoparcUserId(value: DinoparcUserId | undefined) {
    this.dinoparcUserIdControl.setValue(value ?? "");
  }

  public get dinoparcUserId(): DinoparcUserId | undefined {
    const value: DinoparcUserId | "" = this.dinoparcUserIdControl.value;
    return value === "" ? undefined : value;
  }

  public readonly unlinkDinoparcForm: FormGroup;
  public readonly userIdControl: FormControl;
  public readonly dinoparcServerControl: FormControl;
  public readonly dinoparcUserIdControl: FormControl;
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
    this.dinoparcServerControl = new FormControl(
      "",
      [Validators.required],
    );
    this.dinoparcUserIdControl = new FormControl(
      "",
      [Validators.required],
    );
    this.unlinkDinoparcForm = new FormGroup({
      userId: this.userIdControl,
      dinoparcServer: this.dinoparcServerControl,
      dinoparcUserId: this.dinoparcUserIdControl,
    });
  }

  ngOnInit(): void {}

  public onSubmitUnlinkDinoparc(event: Event) {
    event.preventDefault();
    if (this.subscription !== null) {
      return;
    }
    const model: any = this.unlinkDinoparcForm.getRawValue();
    const userId: UserId = model.userId;
    const dinoparcServer: DinoparcServer = model.dinoparcServer;
    const dinoparcUserId: DinoparcUserId = model.dinoparcUserId;
    const updateResult$ = this.user.unlinkFromDinoparc({userId, dinoparcServer, dinoparcUserId});
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
