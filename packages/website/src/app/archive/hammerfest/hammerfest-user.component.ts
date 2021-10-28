import { Component, Input } from "@angular/core";
import { AuthType } from "@eternal-twin/core/auth/auth-type";
import { HammerfestUser } from "@eternal-twin/core/hammerfest/hammerfest-user";
import { BehaviorSubject, combineLatest, Observable, of as rxOf } from "rxjs";
import { catchError as rxCatchError } from "rxjs/internal/operators/catchError";
import { map as rxMap } from "rxjs/internal/operators/map";
import { startWith as rxStartWith } from "rxjs/operators";

import { AuthService } from "../../../modules/auth/auth.service";

@Component({
  selector: "etwin-hammerfest-user",
  templateUrl: "./hammerfest-user.component.html",
  styleUrls: [],
})
export class HammerfestUserComponent {
  @Input()
  public set user(value: HammerfestUser | undefined) {
    this.user$.next(value);
  }

  public get user(): HammerfestUser {
    return this.user$.value!;
  }

  user$: BehaviorSubject<HammerfestUser | undefined>;

  canArchive$: Observable<boolean>;

  constructor(auth: AuthService) {
    this.user$ = new BehaviorSubject<HammerfestUser | undefined>(undefined);

    this.canArchive$ = combineLatest([
      this.user$,
      auth.auth(),
    ]).pipe(
      rxMap(([user, acx]) => {
        if (user === undefined || acx.type !== AuthType.User) {
          return false;
        }
        return user.etwin.current !== null && user.etwin.current.user.id === acx.user.id;
      }),
      rxStartWith(false),
      rxCatchError(() => rxOf(false)),
    );
  }
}
