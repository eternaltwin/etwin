import { ChangeDetectorRef, Component, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type";
import { Observable, Subscription } from "rxjs";

import { AuthService } from "../../modules/auth/auth.service";

@Component({
  selector: "etwin-bar",
  templateUrl: "./etwin-bar.component.html",
  styleUrls: [],
})
export class EtwinBarComponent implements OnDestroy {
  public readonly AuthType = AuthType;

  public readonly auth$: Observable<AuthContext>;

  private readonly auth: AuthService;
  private readonly router: Router;

  private pendingSubscription: Subscription | null;

  constructor(auth: AuthService, router: Router) {
    this.auth = auth;
    this.router = router;

    this.pendingSubscription = null;
    this.auth$ = auth.auth();
  }

  public onSignOut(event: Event) {
    event.preventDefault();
    if (this.pendingSubscription !== null) {
      return;
    }
    const signOutResult$ = this.auth.logout();
    const subscription: Subscription = signOutResult$.subscribe({
      next: async (): Promise<void> => {
        subscription.unsubscribe();
        this.pendingSubscription = null;
        await this.router.navigateByUrl("/");
      },
      error: (err: Error): void => {
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
