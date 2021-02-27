import { Injectable } from "@angular/core";
import { $MaybeCompleteUser, MaybeCompleteUser } from "@eternal-twin/core/lib/user/maybe-complete-user";
import { $UpdateUserPatch, UpdateUserPatch } from "@eternal-twin/core/lib/user/update-user-patch";
import { $User, User } from "@eternal-twin/core/lib/user/user";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
import { Observable, of as rxOf } from "rxjs";
import { catchError as rxCatchError } from "rxjs/operators";

import { RestService } from "../rest/rest.service";
import { UserService } from "./user.service";

@Injectable()
export class BrowserUserService extends UserService {
  readonly #rest: RestService;

  constructor(rest: RestService) {
    super();
    this.#rest = rest;
  }

  getUserById(userId: UserId): Observable<MaybeCompleteUser | null> {
    return this.#rest
      .get(["users", userId], {resType: $MaybeCompleteUser})
      .pipe(
        rxCatchError((err: Error): Observable<null> => {
          return rxOf(null);
        }),
      );
  }

  updateUser(userId: UserId, patch: Readonly<UpdateUserPatch>): Observable<User> {
    return this.#rest.patch(["users", userId], {
      reqType: $UpdateUserPatch,
      req: patch,
      resType: $User,
    });
  }
}
