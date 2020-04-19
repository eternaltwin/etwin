import { Injectable } from "@angular/core";
import { TransferState } from "@angular/platform-browser";
import { $AuthContext, AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context";
import { AuthScope } from "@eternal-twin/etwin-api-types/lib/auth/auth-scope";
import { AuthType } from "@eternal-twin/etwin-api-types/lib/auth/auth-type";
import { JsonValueReader } from "kryo-json/lib/json-value-reader";
import { Observable, of as rxOf } from "rxjs";

import { RestService } from "../rest/rest.service";
import { AuthService } from "./auth.service";
import { AUTH_CONTEXT_KEY, RawAuthContext } from "./state-keys";

const JSON_VALUE_READER: JsonValueReader = new JsonValueReader();

const GUEST_AUTH_CONTEXT: AuthContext = {type: AuthType.Guest, scope: AuthScope.Default};

@Injectable()
export class BrowserAuthService extends AuthService {
  private readonly rest: RestService;
  private readonly auth$: Observable<AuthContext>;

  constructor(transferState: TransferState, rest: RestService) {
    super();
    this.rest = rest;

    let firstAuth: Observable<AuthContext>;

    const transferredAuth: RawAuthContext | undefined = transferState.get(AUTH_CONTEXT_KEY, undefined);
    if (transferredAuth !== undefined) {
      let auth: AuthContext = GUEST_AUTH_CONTEXT;
      try {
        auth = $AuthContext.read(JSON_VALUE_READER, transferredAuth);
      } catch (err) {
        console.error(err);
      }
      firstAuth = rxOf(auth);
    } else {
      firstAuth = this.getSelf();
    }

    this.auth$ = firstAuth;
  }

  auth(): Observable<AuthContext> {
    return this.auth$;
  }

  private getSelf(): Observable<AuthContext> {
    return this.rest.get(["auth", "self"], $AuthContext);
  }
}
