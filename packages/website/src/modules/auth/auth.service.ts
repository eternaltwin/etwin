import { Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context";
import { Credentials } from "@eternal-twin/etwin-api-types/lib/auth/credentials";
import { RegisterWithUsernameOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-with-username-options";
import { HammerfestCredentials } from "@eternal-twin/etwin-api-types/lib/hammerfest/hammerfest-credentials";
import { User } from "@eternal-twin/etwin-api-types/lib/user/user";
import { Observable } from "rxjs";

@Injectable()
export abstract class AuthService {
  abstract auth(): Observable<AuthContext>;

  abstract registerWithUsername(options: Readonly<RegisterWithUsernameOptions>): Observable<User>;

  abstract loginWithCredentials(options: Readonly<Credentials>): Observable<User>;

  abstract loginWithHammerfestCredentials(credentials: Readonly<HammerfestCredentials>): Observable<User>;

  abstract logout(): Observable<null>;
}
