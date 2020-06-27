import { Inject, Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { Credentials } from "@eternal-twin/core/lib/auth/credentials";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options";
import { HammerfestCredentials } from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials";
import { User } from "@eternal-twin/core/lib/user/user";
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

  loginWithCredentials(options: Readonly<Credentials>): Observable<User> {
    throw new Error("NotImplemented");
  }

  loginWithHammerfestCredentials(credentials: Readonly<HammerfestCredentials>): Observable<User> {
    throw new Error("NotImplemented");
  }
}
