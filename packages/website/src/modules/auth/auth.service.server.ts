import { Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/core/lib/auth/auth-context";
import { AuthScope } from "@eternal-twin/core/lib/auth/auth-scope";
import { AuthType } from "@eternal-twin/core/lib/auth/auth-type";
import { Credentials } from "@eternal-twin/core/lib/auth/credentials";
import { RegisterWithUsernameOptions } from "@eternal-twin/core/lib/auth/register-with-username-options";
import { HammerfestCredentials } from "@eternal-twin/core/lib/hammerfest/hammerfest-credentials";
import { User } from "@eternal-twin/core/lib/user/user";
import { Observable, of as rxOf } from "rxjs";

import { AuthService } from "./auth.service";

const GUEST_AUTH_CONTEXT: AuthContext = {type: AuthType.Guest, scope: AuthScope.Default};

@Injectable()
export class ServerAuthService extends AuthService {
  private readonly auth$: Observable<AuthContext>;

  constructor() {
    super();
    this.auth$ = this.getSelf();
  }

  auth(): Observable<AuthContext> {
    return this.auth$;
  }

  private getSelf(): Observable<AuthContext> {
    return rxOf(GUEST_AUTH_CONTEXT);
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
