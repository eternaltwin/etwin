import { Inject, Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/auth/auth-context";
import { MaybeCompleteUser } from "@eternal-twin/core/user/maybe-complete-user";
import { UserService as CoreUserService } from "@eternal-twin/core/user/service";
import { UnlinkFromDinoparcOptions } from "@eternal-twin/core/user/unlink-from-dinoparc-options";
import { UnlinkFromHammerfestOptions } from "@eternal-twin/core/user/unlink-from-hammerfest-options";
import { UnlinkFromTwinoidOptions } from "@eternal-twin/core/user/unlink-from-twinoid-options";
import { UpdateUserPatch } from "@eternal-twin/core/user/update-user-patch";
import { User } from "@eternal-twin/core/user/user";
import { UserId } from "@eternal-twin/core/user/user-id";
import { from as rxFrom, Observable } from "rxjs";

import { AUTH_CONTEXT, USER } from "../../server/tokens";
import { UserService } from "./user.service";

@Injectable()
export class ServerUserService extends UserService {
  readonly #acx: AuthContext;
  readonly #user: CoreUserService;

  constructor(@Inject(AUTH_CONTEXT) acx: AuthContext, @Inject(USER) user: CoreUserService) {
    super();
    this.#acx = acx;
    this.#user = user;
  }

  getUserById(userId: UserId): Observable<MaybeCompleteUser | null> {
    return rxFrom(this.#user.getUserById(this.#acx, {id: userId}));
  }

  updateUser(userId: UserId, patch: Readonly<UpdateUserPatch>): Observable<User> {
    throw new Error("AssertionError: Server side service is read-only (updateUser)");
  }

  unlinkFromDinoparc(options: Readonly<UnlinkFromDinoparcOptions>): Observable<null> {
    throw new Error("AssertionError: Server side service is read-only (unlinkFromDinoparc)");
  }

  unlinkFromHammerfest(options: Readonly<UnlinkFromHammerfestOptions>): Observable<null> {
    throw new Error("AssertionError: Server side service is read-only (unlinkFromHammerfest)");
  }

  unlinkFromTwinoid(options: Readonly<UnlinkFromTwinoidOptions>): Observable<null> {
    throw new Error("AssertionError: Server side service is read-only (unlinkFromTwinoid)");
  }
}
