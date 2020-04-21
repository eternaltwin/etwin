import { Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context";
import { AuthScope } from "@eternal-twin/etwin-api-types/lib/auth/auth-scope";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type";
import { RegisterWithUsernameOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-with-username-options";
import { User } from "@eternal-twin/etwin-api-types/lib/user/user";
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
}
