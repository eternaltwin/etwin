import { Injectable } from "@angular/core";
import { TransferState } from "@angular/platform-browser";
import { CompleteUser } from "@eternal-twin/core/lib/user/complete-user";
import { User } from "@eternal-twin/core/lib/user/user";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { Observable, of as rxOf } from "rxjs";
import { catchError as rxCatchError } from "rxjs/operators";

import { RestService } from "../rest/rest.service";
import { $MaybeCompleteUser } from "./maybe-complete-user";
import { UserService } from "./user.service";

@Injectable()
export class BrowserUserService extends UserService {
  private readonly rest: RestService;

  constructor(transferState: TransferState, rest: RestService) {
    super();
    this.rest = rest;
  }

  getUserById(userId: UserId): Observable<User | CompleteUser | null> {
    return this.rest.get(["users", userId], $MaybeCompleteUser)
      .pipe(
        rxCatchError((err: Error): Observable<null> => {
          return rxOf(null);
        }),
      );
  }
}
