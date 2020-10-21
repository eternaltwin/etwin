import { Injectable } from "@angular/core";
import { TransferState } from "@angular/platform-browser";
import { $MaybeCompleteUser, MaybeCompleteUser } from "@eternal-twin/core/lib/user/maybe-complete-user";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { Observable, of as rxOf } from "rxjs";
import { catchError as rxCatchError } from "rxjs/operators";

import { RestService } from "../rest/rest.service";
import { UserService } from "./user.service";

@Injectable()
export class BrowserUserService extends UserService {
  private readonly rest: RestService;

  constructor(transferState: TransferState, rest: RestService) {
    super();
    this.rest = rest;
  }

  getUserById(userId: UserId): Observable<MaybeCompleteUser | null> {
    return this.rest.get(["users", userId], {resType: $MaybeCompleteUser})
      .pipe(
        rxCatchError((err: Error): Observable<null> => {
          return rxOf(null);
        }),
      );
  }
}
