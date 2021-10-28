import { Inject, Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/auth/auth-context";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/auth/register-with-username-options";
import { UserCredentials } from "@eternal-twin/core/auth/user-credentials";
import { DinoparcCredentials } from "@eternal-twin/core/dinoparc/dinoparc-credentials";
import { HammerfestCredentials } from "@eternal-twin/core/hammerfest/hammerfest-credentials";
import { User } from "@eternal-twin/core/user/user";
import { Observable, of as rxOf } from "rxjs";

import { AUTH_CONTEXT } from "../../server/tokens";
import { AuthService } from "./auth.service";

@Injectable()
export class ServerAuthService extends AuthService {
  private readonly auth$: Observable<AuthContext>;
  readonly #acx: AuthContext;

  constructor(@Inject(AUTH_CONTEXT) acx: AuthContext) {
    super();
    this.auth$ = rxOf(acx);
    this.#acx = acx;
  }

  auth(): Observable<AuthContext> {
    return this.auth$;
  }

  logout(): Observable<null> {
    throw new Error("NotImplemented");
  }

  registerWithUsername(options: Readonly<RegisterWithUsernameOptions>): Observable<User> {
    throw new Error("NotImplemented");
  }

  loginWithCredentials(options: Readonly<UserCredentials>): Observable<User> {
    throw new Error("NotImplemented");
  }

  loginWithDinoparcCredentials(credentials: Readonly<DinoparcCredentials>): Observable<User> {
    throw new Error("NotImplemented");
  }

  loginWithHammerfestCredentials(credentials: Readonly<HammerfestCredentials>): Observable<User> {
    throw new Error("NotImplemented");
  }
}
