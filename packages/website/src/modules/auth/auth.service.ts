import { Injectable } from "@angular/core";
import { AuthContext } from "@eternal-twin/etwin-api-types/lib/auth/auth-context";
import { Credentials } from "@eternal-twin/etwin-api-types/lib/auth/credentials";
import { LoginWithHammerfestOptions } from "@eternal-twin/etwin-api-types/lib/auth/login-with-hammerfest-options";
import { RegisterWithUsernameOptions } from "@eternal-twin/etwin-api-types/lib/auth/register-with-username-options";
import { User } from "@eternal-twin/etwin-api-types/lib/user/user";
import { Observable } from "rxjs";

@Injectable()
export abstract class AuthService {
  abstract auth(): Observable<AuthContext>;

  abstract registerWithUsername(options: Readonly<RegisterWithUsernameOptions>): Observable<User>;

  abstract loginWithCredentials(options: Readonly<Credentials>): Observable<User>;

  abstract loginWithHammerfestCredentials(options: Readonly<LoginWithHammerfestOptions>): Observable<User>;

  abstract logout(): Observable<null>;
}
