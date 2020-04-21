import { Component, OnDestroy } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { User } from "@eternal-twin/etwin-api-types/lib/user/user";
import { $UserDisplayName, UserDisplayName } from "@eternal-twin/etwin-api-types/lib/user/user-display-name";
import { $Username, Username } from "@eternal-twin/etwin-api-types/lib/user/username";
import { Subscription } from "rxjs";

import { AuthService } from "../../../modules/auth/auth.service";

const TEXT_ENCODER: TextEncoder = new TextEncoder();

@Component({
  selector: "etwin-register-username",
  templateUrl: "./register-username.component.html",
  styleUrls: [],
})
export class RegisterUsernameComponent implements OnDestroy {
  public readonly $Username = $Username;
  public readonly $UserDisplayName = $UserDisplayName;
  public readonly PASSWORD_LEN: number = 10;

  public readonly registrationForm: FormGroup;
  public readonly username: FormControl;
  public readonly displayName: FormControl;
  public readonly password: FormControl;

  private readonly auth: AuthService;
  private readonly router: Router;
  private pendingSubscription: Subscription | null;
  private serverError: Error | null;

  constructor(auth: AuthService, router: Router) {
    this.auth = auth;
    this.router = router;

    this.username = new FormControl(
      "",
      [Validators.required, Validators.minLength($Username.minLength ?? 0), Validators.maxLength($Username.maxLength), Validators.pattern($Username.pattern!)],
    );
    this.displayName = new FormControl(
      "",
      [Validators.minLength($UserDisplayName.minLength ?? 0), Validators.maxLength($UserDisplayName.maxLength), Validators.pattern($UserDisplayName.pattern!)],
    );
    this.password = new FormControl(
      "",
      [Validators.required, Validators.minLength(this.PASSWORD_LEN)],
    );
    this.registrationForm = new FormGroup({
      username: this.username,
      displayName: this.displayName,
      password: this.password,
    });
    this.pendingSubscription = null;
    this.serverError = null;
  }

  public onSubmit(event: Event) {
    event.preventDefault();
    if (this.pendingSubscription !== null) {
      return;
    }
    const model: any = this.registrationForm.getRawValue();
    const username: Username = model.username;
    const displayName: UserDisplayName = model.displayName;
    const passwordStr: string = model.password;
    const password: Uint8Array = TEXT_ENCODER.encode(passwordStr);
    const authResult$ = this.auth.registerWithUsername({username, displayName, password});
    this.serverError = null;
    const subscription: Subscription = authResult$.subscribe({
      next: (_value: User): void => {
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
      }
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
