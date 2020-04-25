import { Component, OnDestroy } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Username } from "@eternal-twin/etwin-api-types/lib/user/username";
import { Subscription } from "rxjs";

import { AuthService } from "../../../modules/auth/auth.service";

const TEXT_ENCODER: TextEncoder = new TextEncoder();

@Component({
  selector: "etwin-login-etwin",
  templateUrl: "./login-etwin.component.html",
  styleUrls: [],
})
export class LoginEtwinComponent implements OnDestroy {
  public readonly loginForm: FormGroup;
  public readonly login: FormControl;
  public readonly password: FormControl;

  private readonly auth: AuthService;
  private readonly router: Router;

  public pendingSubscription: Subscription | null;
  public serverError: Error | null;

  constructor(auth: AuthService, router: Router) {
    this.auth = auth;
    this.router = router;

    this.login = new FormControl(
      "",
      [Validators.required],
    );
    this.password = new FormControl(
      "",
      [Validators.required],
    );
    this.loginForm = new FormGroup({
      login: this.login,
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
    const model: any = this.loginForm.getRawValue();
    const login: Username = model.login;
    const passwordStr: string = model.password;
    const password: Uint8Array = TEXT_ENCODER.encode(passwordStr);
    const authResult$ = this.auth.loginWithCredentials({login, password});
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
