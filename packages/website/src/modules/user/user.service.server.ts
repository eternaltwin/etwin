import { Inject, Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { CompleteUser } from "@eternal-twin/core/lib/user/complete-user";
import { UserService as CoreUserService } from "@eternal-twin/core/lib/user/service";
import { User } from "@eternal-twin/core/lib/user/user";
import { UserId } from "@eternal-twin/core/lib/user/user-id";
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

  getUserById(userId: UserId): Observable<User | CompleteUser | null> {
    return rxFrom(this.#user.getUserById(this.#acx, userId));
  }
}
