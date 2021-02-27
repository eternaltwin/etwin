import { DOCUMENT } from "@angular/common";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { RawUserLogin } from "@eternal-twin/core/lib/auth/raw-user-login";
import { Subscription } from "rxjs";
import { first as rxFirst } from "rxjs/operators";

import { AuthService } from "../../../modules/auth/auth.service";

const TEXT_ENCODER: TextEncoder = new TextEncoder();

@Component({
  selector: "etwin-login-etwin",
  templateUrl: "./login-etwin.component.html",
  styleUrls: [],
})
export class LoginEtwinComponent implements OnDestroy, OnInit {
  public readonly loginForm: FormGroup;
  public readonly login: FormControl;
  public readonly password: FormControl;

  private readonly auth: AuthService;
  private readonly router: Router;
  private readonly route: ActivatedRoute
  private readonly document: Document;

  private nextUri: string | undefined;

  public pendingSubscription: Subscription | null;
  public serverError: Error | null;

  constructor(auth: AuthService, router: Router, route: ActivatedRoute, @Inject(DOCUMENT) document: Document) {
    this.auth = auth;
    this.router = router;
    this.route = route;
    this.document = document;

    this.nextUri = undefined;

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
    let login: RawUserLogin = model.login;
    if (login.indexOf("@") < 0) {
      login = login.toLowerCase();
    }
    const passwordStr: string = model.password;
    const password: Uint8Array = TEXT_ENCODER.encode(passwordStr);
    const authResult$ = this.auth.loginWithCredentials({login, password});
    this.serverError = null;
    const subscription: Subscription = authResult$.subscribe({
      next: (): void => {
        subscription.unsubscribe();
        this.pendingSubscription = null;
        if (this.nextUri !== undefined) {
          this.document.location.href = this.nextUri;
        } else {
          this.router.navigateByUrl("/");
        }
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

  ngOnInit(): void {
    this.route.queryParams.pipe(rxFirst()).toPromise().then((value: Params) => {
      if (typeof value.next === "string" && value.next.startsWith("/")) {
        this.nextUri = value.next;
      }
    });
  }
}
