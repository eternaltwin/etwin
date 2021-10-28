import { DOCUMENT } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { CompleteUser } from "@eternal-twin/core/user/complete-user";
import { $RawUsername, RawUsername } from "@eternal-twin/core/user/raw-username";
import { $UserDisplayName, UserDisplayName } from "@eternal-twin/core/user/user-display-name";
import { UserId } from "@eternal-twin/core/user/user-id";
import { $Username, Username } from "@eternal-twin/core/user/username";
import { NEVER as RX_NEVER, Observable, Subscription } from "rxjs";
import { map as rxMap } from "rxjs/operators";

import { UserService } from "../../modules/user/user.service";

const RESOLUTION_ERROR: unique symbol = Symbol("RESOLUTION_ERROR");

const TEXT_ENCODER: TextEncoder = new TextEncoder();

const passwordConfirmationMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password: AbstractControl | null = control.get("password");
  const password2: AbstractControl | null = control.get("password2");

  if (password !== null && password2 !== null && password.value === password2.value) {
    return null;
  } else {
    return {passwordConfirmationMatch: true};
  }
};

@Component({
  selector: "etwin-legal-view",
  templateUrl: "./settings-view.component.html",
  styleUrls: [],
})
export class SettingsViewComponent implements OnInit {
  public readonly $UserDisplayName = $UserDisplayName;
  public readonly $RawUsername = $RawUsername;
  public readonly PASSWORD_LEN: number = 10;

  public readonly displayNameForm: FormGroup;
  public readonly displayName: FormControl;
  public readonly displayNameUserId: FormControl;
  public displayNameSubscription: Subscription | null = null;
  public displayNameServerError: Error | null = null;

  public readonly usernameForm: FormGroup;
  public readonly username: FormControl;
  public readonly usernameUserId: FormControl;
  public usernameSubscription: Subscription | null = null;
  public usernameServerError: Error | null = null;

  public readonly passwordForm: FormGroup;
  public readonly password: FormControl;
  public readonly password2: FormControl;
  public readonly passwordUserId: FormControl;
  public passwordSubscription: Subscription | null = null;
  public passwordServerError: Error | null = null;

  public user$: Observable<CompleteUser | typeof RESOLUTION_ERROR>;
  public readonly RESOLUTION_ERROR = RESOLUTION_ERROR;

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

    this.user$ = RX_NEVER;

    this.displayName = new FormControl(
      "",
      [Validators.required, Validators.minLength($UserDisplayName.minLength ?? 0), Validators.maxLength($UserDisplayName.maxLength), Validators.pattern($UserDisplayName.pattern!)],
    );
    this.displayNameUserId = new FormControl(
      "",
      [Validators.required],
    );
    this.displayNameForm = new FormGroup({
      displayName: this.displayName,
      userId: this.displayNameUserId,
    });

    this.username = new FormControl(
      "",
      [Validators.required, Validators.minLength($Username.minLength ?? 0), Validators.maxLength($Username.maxLength), Validators.pattern($Username.pattern!)],
    );
    this.usernameUserId = new FormControl(
      "",
      [Validators.required],
    );
    this.usernameForm = new FormGroup({
      username: this.username,
      userId: this.usernameUserId,
    });

    this.password = new FormControl(
      "",
      [Validators.required, Validators.minLength(this.PASSWORD_LEN)],
    );
    this.password2 = new FormControl(
      "",
      [Validators.required],
    );
    this.passwordUserId = new FormControl(
      "",
      [Validators.required],
    );
    this.passwordForm = new FormGroup({
      password: this.password,
      password2: this.password2,
      userId: this.passwordUserId,
    }, {validators: [passwordConfirmationMatchValidator]});
  }

  ngOnInit(): void {
    interface RouteData {
      user: CompleteUser | null;
    }

    const routeData$: Observable<RouteData> = this.route.data as any;
    this.user$ = routeData$.pipe(rxMap(({user}: RouteData): CompleteUser | typeof RESOLUTION_ERROR => {
      if (user === null) {
        return RESOLUTION_ERROR;
      }
      this.displayNameUserId.setValue(user.id ?? "");
      this.usernameUserId.setValue(user.id ?? "");
      this.passwordUserId.setValue(user.id ?? "");
      return user;
    }));
  }

  public onSubmitDisplayName(event: Event) {
    event.preventDefault();
    if (this.displayNameSubscription !== null) {
      return;
    }
    const model: any = this.displayNameForm.getRawValue();
    const displayName: UserDisplayName = model.displayName;
    const userId: UserId = model.userId;
    const updateResult$ = this.user.updateUser(userId, {displayName});
    this.displayNameServerError = null;
    const subscription: Subscription = updateResult$.subscribe({
      next: (): void => {
        subscription.unsubscribe();
        this.displayNameSubscription = null;
        this.document.location.reload();
      },
      error: (err: Error): void => {
        subscription.unsubscribe();
        this.displayNameSubscription = null;
        this.displayNameServerError = err;
      },
      complete: (): void => {
        subscription.unsubscribe();
        this.displayNameSubscription = null;
      },
    });
    this.displayNameSubscription = subscription;
  }

  public onSubmitUsername(event: Event) {
    event.preventDefault();
    if (this.usernameSubscription !== null) {
      return;
    }
    const model: any = this.usernameForm.getRawValue();
    const rawUsername: RawUsername = model.username;
    const username: Username = rawUsername.toLowerCase();
    const userId: UserId = model.userId;
    const updateResult$ = this.user.updateUser(userId, {username});
    this.usernameServerError = null;
    const subscription: Subscription = updateResult$.subscribe({
      next: (): void => {
        subscription.unsubscribe();
        this.usernameSubscription = null;
        this.document.location.reload();
      },
      error: (err: Error): void => {
        subscription.unsubscribe();
        this.usernameSubscription = null;
        this.usernameServerError = err;
      },
      complete: (): void => {
        subscription.unsubscribe();
        this.usernameSubscription = null;
      },
    });
    this.usernameSubscription = subscription;
  }

  public onSubmitPassword(event: Event) {
    event.preventDefault();
    if (this.passwordSubscription !== null) {
      return;
    }
    const model: any = this.passwordForm.getRawValue();
    const passwordStr: string = model.password;
    const password: Uint8Array = TEXT_ENCODER.encode(passwordStr);
    const userId: UserId = model.userId;
    const updateResult$ = this.user.updateUser(userId, {password});
    this.passwordServerError = null;
    const subscription: Subscription = updateResult$.subscribe({
      next: (): void => {
        subscription.unsubscribe();
        this.passwordSubscription = null;
        this.document.location.reload();
      },
      error: (err: Error): void => {
        subscription.unsubscribe();
        this.passwordSubscription = null;
        this.passwordServerError = err;
      },
      complete: (): void => {
        subscription.unsubscribe();
        this.passwordSubscription = null;
      },
    });
    this.passwordSubscription = subscription;
  }
}
