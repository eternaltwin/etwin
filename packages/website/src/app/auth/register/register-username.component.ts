import { Component, OnDestroy } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { $RawUsername, RawUsername } from "@eternal-twin/core/user/raw-username";
import { $UserDisplayName, UserDisplayName } from "@eternal-twin/core/user/user-display-name";
import { Username } from "@eternal-twin/core/user/username";
import { Subscription } from "rxjs";

import { AuthService } from "../../../modules/auth/auth.service";

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
  selector: "etwin-register-username",
  templateUrl: "./register-username.component.html",
  styleUrls: [],
})
export class RegisterUsernameComponent implements OnDestroy {
  public readonly $RawUsername = $RawUsername;
  public readonly $UserDisplayName = $UserDisplayName;
  public readonly PASSWORD_LEN: number = 10;

  public readonly registrationForm: FormGroup;
  public readonly username: FormControl;
  public readonly displayName: FormControl;
  public readonly password: FormControl;
  public readonly password2: FormControl;

  private readonly auth: AuthService;
  private readonly router: Router;
  public pendingSubscription: Subscription | null;
  public serverError: Error | null;

  constructor(auth: AuthService, router: Router) {
    this.auth = auth;
    this.router = router;

    this.username = new FormControl(
      "",
      [Validators.required, Validators.minLength($RawUsername.minLength ?? 0), Validators.maxLength($RawUsername.maxLength), Validators.pattern($RawUsername.pattern!)],
    );
    this.displayName = new FormControl(
      "",
      [Validators.minLength($UserDisplayName.minLength ?? 0), Validators.maxLength($UserDisplayName.maxLength), Validators.pattern($UserDisplayName.pattern!)],
    );
    this.password = new FormControl(
      "",
      [Validators.required, Validators.minLength(this.PASSWORD_LEN)],
    );
    this.password2 = new FormControl(
      "",
      [Validators.required],
    );
    this.registrationForm = new FormGroup({
      username: this.username,
      displayName: this.displayName,
      password: this.password,
      password2: this.password2,
    }, {validators: [passwordConfirmationMatchValidator]});
    this.pendingSubscription = null;
    this.serverError = null;
  }

  public onSubmit(event: Event) {
    event.preventDefault();
    if (this.pendingSubscription !== null) {
      return;
    }
    const model: any = this.registrationForm.getRawValue();
    const rawUsername: RawUsername = model.username;
    const username: Username = rawUsername.toLowerCase();
    const displayName: UserDisplayName = model.displayName;
    const passwordStr: string = model.password;
    const password: Uint8Array = TEXT_ENCODER.encode(passwordStr);
    const authResult$ = this.auth.registerWithUsername({username, displayName, password});
    this.serverError = null;
    const subscription: Subscription = authResult$.subscribe({
      next: (): void => {
        subscription.unsubscribe();
        this.pendingSubscription = null;
        this.router.navigateByUrl("/");
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

  ngOnDestroy(): void {
    if (this.pendingSubscription !== null) {
      this.pendingSubscription.unsubscribe();
      this.pendingSubscription = null;
    }
  }
}
