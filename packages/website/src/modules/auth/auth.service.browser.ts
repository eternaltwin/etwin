import { Injectable } from "@angular/core";
import { TransferState } from "@angular/platform-browser";
import { $AuthContext, AuthContext } from "@eternal-twin/core/auth/auth-context";
import { AuthMethod } from "@eternal-twin/core/auth/auth-method";
import { AuthScope } from "@eternal-twin/core/auth/auth-scope";
import { AuthType } from "@eternal-twin/core/auth/auth-type";
import { $CreateSessionQuery } from "@eternal-twin/core/auth/create-session-query";
import { $RawUserCredentials, RawUserCredentials } from "@eternal-twin/core/auth/raw-user-credentials";
import {
  $RegisterWithUsernameOptions,
  RegisterWithUsernameOptions,
} from "@eternal-twin/core/auth/register-with-username-options";
import { UserAuthContext } from "@eternal-twin/core/auth/user-auth-context";
import { ObjectType } from "@eternal-twin/core/core/object-type";
import { $DinoparcCredentials, DinoparcCredentials } from "@eternal-twin/core/dinoparc/dinoparc-credentials";
import {
  $HammerfestCredentials,
  HammerfestCredentials,
} from "@eternal-twin/core/hammerfest/hammerfest-credentials";
import { $User, User } from "@eternal-twin/core/user/user";
import { JsonValueReader } from "kryo-json/json-value-reader";
import { concat as rxConcat, NEVER as RX_NEVER, Observable, of as rxOf, ReplaySubject } from "rxjs";
import { map as rxMap, tap as rxTap } from "rxjs/operators";

import { RestService } from "../rest/rest.service";
import { AuthService } from "./auth.service";
import { AUTH_CONTEXT_KEY, RawAuthContext } from "./state-keys";

const JSON_VALUE_READER: JsonValueReader = new JsonValueReader();

const GUEST_AUTH_CONTEXT: AuthContext = {type: AuthType.Guest, scope: AuthScope.Default};

@Injectable()
export class BrowserAuthService extends AuthService {
  readonly #rest: RestService;
  readonly #auth$: ReplaySubject<AuthContext>;

  constructor(transferState: TransferState, rest: RestService) {
    super();
    this.#rest = rest;

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

    // Prevent the `complete` event.
    const infFirstAuth: Observable<AuthContext> = rxConcat(firstAuth, RX_NEVER);

    this.#auth$ = new ReplaySubject(1);
    infFirstAuth.subscribe(this.#auth$);
  }

  public auth(): Observable<AuthContext> {
    return this.#auth$;
  }

  public registerWithUsername(options: Readonly<RegisterWithUsernameOptions>): Observable<User> {
    return this.#rest.post(["users"], {reqType: $RegisterWithUsernameOptions, req: options, resType: $User})
      .pipe(rxTap((user: User): void => {
        const auth: UserAuthContext = {
          type: AuthType.User,
          scope: AuthScope.Default,
          user: {
            type: ObjectType.User,
            id: user.id,
            displayName: user.displayName,
          },
          isAdministrator: user.isAdministrator,
        };
        this.#auth$.next(auth);
      }));
  }

  loginWithCredentials(options: Readonly<RawUserCredentials>): Observable<User> {
    const reqOptions = {
      queryType: $CreateSessionQuery,
      query: {method: AuthMethod.Etwin},
      reqType: $RawUserCredentials,
      req: options,
      resType: $User,
    };
    return this.#rest.put(["auth", "self"], reqOptions)
      .pipe(rxTap((user: User): void => {
        const auth: UserAuthContext = {
          type: AuthType.User,
          scope: AuthScope.Default,
          user: {
            type: ObjectType.User,
            id: user.id,
            displayName: user.displayName,
          },
          isAdministrator: user.isAdministrator,
        };
        this.#auth$.next(auth);
      }));
  }

  loginWithDinoparcCredentials(options: Readonly<DinoparcCredentials>): Observable<User> {
    const reqOptions = {
      queryType: $CreateSessionQuery,
      query: {method: AuthMethod.Dinoparc},
      reqType: $DinoparcCredentials,
      req: options,
      resType: $User,
    };
    return this.#rest.put(["auth", "self"], reqOptions)
      .pipe(rxTap((user: User): void => {
        const auth: UserAuthContext = {
          type: AuthType.User,
          scope: AuthScope.Default,
          user: {
            type: ObjectType.User,
            id: user.id,
            displayName: user.displayName,
          },
          isAdministrator: user.isAdministrator,
        };
        this.#auth$.next(auth);
      }));
  }

  loginWithHammerfestCredentials(options: Readonly<HammerfestCredentials>): Observable<User> {
    const reqOptions = {
      queryType: $CreateSessionQuery,
      query: {method: AuthMethod.Hammerfest},
      reqType: $HammerfestCredentials,
      req: options,
      resType: $User,
    };
    return this.#rest.put(["auth", "self"], reqOptions)
      .pipe(rxTap((user: User): void => {
        const auth: UserAuthContext = {
          type: AuthType.User,
          scope: AuthScope.Default,
          user: {
            type: ObjectType.User,
            id: user.id,
            displayName: user.displayName,
          },
          isAdministrator: user.isAdministrator,
        };
        this.#auth$.next(auth);
      }));
  }

  logout(): Observable<null> {
    return this.#rest.delete(["auth", "self"], {resType: $AuthContext})
      .pipe(
        rxMap((): null => {
          this.#auth$.next(GUEST_AUTH_CONTEXT);
          return null;
        }),
      );
  }

  private getSelf(): Observable<AuthContext> {
    return this.#rest.get(["auth", "self"], {resType: $AuthContext});
  }
}
