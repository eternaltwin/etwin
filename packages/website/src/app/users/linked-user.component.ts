import { Component, Input } from "@angular/core";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type";
import { ObjectType } from "@eternal-twin/core/lib/core/object-type";
import { DinoparcLink } from "@eternal-twin/core/lib/link/dinoparc-link";
import { HammerfestLink } from "@eternal-twin/core/lib/link/hammerfest-link";
import { TwinoidLink } from "@eternal-twin/core/lib/link/twinoid-link";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { Observable, of as rxOf } from "rxjs";
import { catchError as rxCatchError } from "rxjs/internal/operators/catchError";
import { map as rxMap } from "rxjs/internal/operators/map";
import { startWith as rxStartWith } from "rxjs/operators";

import { AuthService } from "../../modules/auth/auth.service";

@Component({
  selector: "etwin-linked-user",
  templateUrl: "./linked-user.component.html",
  styleUrls: [],
})
export class LinkedUserComponent {
  public readonly ObjectType = ObjectType;

  @Input()
  public userId!: UserId;

  @Input()
  public link!: DinoparcLink | HammerfestLink | TwinoidLink;

  public isAdministrator$: Observable<boolean>;

  constructor(auth: AuthService) {
    this.isAdministrator$ = auth.auth().pipe(
      rxMap((acx) => acx.type === AuthType.User && acx.isAdministrator),
      rxStartWith(false),
      rxCatchError(() => rxOf(false)),
    );
  }
}
