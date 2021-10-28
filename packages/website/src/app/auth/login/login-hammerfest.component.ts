import { DOCUMENT } from "@angular/common";
import { Component, Inject, OnDestroy } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { HammerfestPassword } from "@eternal-twin/core/hammerfest/hammerfest-password";
import { HammerfestServer } from "@eternal-twin/core/hammerfest/hammerfest-server";
import { HammerfestUsername } from "@eternal-twin/core/hammerfest/hammerfest-username";
import { firstValueFrom, Subscription } from "rxjs";
import { first as rxFirst } from "rxjs/operators";

import { AuthService } from "../../../modules/auth/auth.service";

@Component({
  selector: "etwin-login-hammerfest",
  templateUrl: "./login-hammerfest.component.html",
  styleUrls: [],
})
export class LoginHammerfestComponent implements OnDestroy {
  public readonly loginForm: FormGroup;
  public readonly server: FormControl;
  public readonly username: FormControl;
  public readonly password: FormControl;

  private readonly auth: AuthService;
  private readonly router: Router;
  private readonly route: ActivatedRoute;
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

    this.server = new FormControl("hammerfest.fr");
    this.username = new FormControl(
      "",
      [Validators.required],
    );
    this.password = new FormControl(
      "",
      [Validators.required],
    );
    this.loginForm = new FormGroup({
      server: this.server,
      username: this.username,
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
    const server: HammerfestServer = model.server;
    const username: HammerfestUsername = model.username;
    const password: HammerfestPassword = model.password;
    const authResult$ = this.auth.loginWithHammerfestCredentials({server, username, password});
    this.serverError = null;
    const subscription: Subscription = authResult$.subscribe({
      next: (): void => {
        subscription.unsubscribe();
        this.pendingSubscription = null;
        if (this.nextUri !== undefined) {
          this.document.location.href = this.nextUri;
          console.log(this.document.location.href);
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

  ngOnInit(): void {
    firstValueFrom(this.route.queryParams).then((value: Params) => {
      if (typeof value.next === "string" && value.next.startsWith("/")) {
        this.nextUri = value.next;
      }
    });
  }
}
