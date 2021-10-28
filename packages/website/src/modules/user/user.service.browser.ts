import { Injectable } from "@angular/core";
import { ObjectType } from "@eternal-twin/core/core/object-type";
import { $DinoparcUserIdRef } from "@eternal-twin/core/dinoparc/dinoparc-user-id-ref";
import { $HammerfestUserIdRef } from "@eternal-twin/core/hammerfest/hammerfest-user-id-ref";
import { $TwinoidUserIdRef } from "@eternal-twin/core/twinoid/twinoid-user-id-ref";
import { $MaybeCompleteUser, MaybeCompleteUser } from "@eternal-twin/core/user/maybe-complete-user";
import { UnlinkFromDinoparcOptions } from "@eternal-twin/core/user/unlink-from-dinoparc-options";
import {
  UnlinkFromHammerfestOptions
} from "@eternal-twin/core/user/unlink-from-hammerfest-options";
import { UnlinkFromTwinoidOptions } from "@eternal-twin/core/user/unlink-from-twinoid-options";
import { $UpdateUserPatch, UpdateUserPatch } from "@eternal-twin/core/user/update-user-patch";
import { $User, User } from "@eternal-twin/core/user/user";
import { UserId } from "@eternal-twin/core/user/user-id";
import { $Any } from "kryo/any";
import { Observable, of as rxOf } from "rxjs";
import { catchError as rxCatchError, map as rxMap } from "rxjs/operators";

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

  unlinkFromDinoparc(options: Readonly<UnlinkFromDinoparcOptions>): Observable<null> {
    return this.#rest.delete(["users", options.userId, "links", options.dinoparcServer], {
      reqType: $DinoparcUserIdRef,
      req: {
        type: ObjectType.DinoparcUser,
        server: options.dinoparcServer,
        id: options.dinoparcUserId,
      },
      resType: $Any,
    }).pipe(rxMap(() => null));
  }

  unlinkFromHammerfest(options: Readonly<UnlinkFromHammerfestOptions>): Observable<null> {
    return this.#rest.delete(["users", options.userId, "links", options.hammerfestServer], {
      reqType: $HammerfestUserIdRef,
      req: {
        type: ObjectType.HammerfestUser,
        server: options.hammerfestServer,
        id: options.hammerfestUserId,
      },
      resType: $Any,
    }).pipe(rxMap(() => null));
  }

  unlinkFromTwinoid(options: Readonly<UnlinkFromTwinoidOptions>): Observable<null> {
    return this.#rest.delete(["users", options.userId, "links", "twinoid.com"], {
      reqType: $TwinoidUserIdRef,
      req: {
        type: ObjectType.TwinoidUser,
        id: options.twinoidUserId,
      },
      resType: $Any,
    }).pipe(rxMap(() => null));
  }
}
