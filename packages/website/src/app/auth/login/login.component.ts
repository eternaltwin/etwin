import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { AuthMethod } from "@eternal-twin/core/lib/auth/auth-method";
import { Subscription } from "rxjs";

@Component({
  selector: "etwin-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnDestroy, OnInit {
  public readonly AuthMethod = AuthMethod;

  private readonly route: ActivatedRoute;

  public method: AuthMethod;
  public next: string | undefined;

  private pendingSubscription: Subscription | null;

  constructor(route: ActivatedRoute) {
    this.route = route;
    this.method = AuthMethod.Etwin;
    this.pendingSubscription = null;
  }

  ngOnInit(): void {
    if (this.pendingSubscription !== null) {
      return;
    }

    const subscription: Subscription = this.route.queryParams.subscribe({
      next: (value: Params): void => {
        switch (value.method) {
          case "dinoparc":
            this.method = AuthMethod.Dinoparc;
            break;
          case "hammerfest":
            this.method = AuthMethod.Hammerfest;
            break;
          case "twinoid":
            this.method = AuthMethod.Twinoid;
            break;
          case "etwin":
          default:
            this.method = AuthMethod.Etwin;
            break;
        }
        if (typeof value.next === "string" && value.next.startsWith("/")) {
          this.next = value.next;
        }
      },
      error: (): void => {
        subscription.unsubscribe();
        this.pendingSubscription = null;
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
